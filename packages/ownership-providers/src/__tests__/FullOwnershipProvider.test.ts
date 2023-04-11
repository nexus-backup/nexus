/* eslint-disable @typescript-eslint/no-explicit-any */
import { BI } from '@ckb-lumos/bi';
import { parseAddress, TransactionSkeleton, TransactionSkeletonType } from '@ckb-lumos/helpers';
import { common } from '@ckb-lumos/common-scripts';
import { Cell, Script } from '@nexus-wallet/protocol';
import { predefined } from '@ckb-lumos/config-manager';
import { secp256k1Blake160 } from '@ckb-lumos/common-scripts';
import { FullOwnershipProvider } from '..';
import { WitnessArgs } from '@ckb-lumos/base/lib/blockchain';
import { bytes } from '@ckb-lumos/codec';
import { FullOwnershipProviderConfig } from '../FullOwnershipProvider';

function getExpectedFee(txSkeleton: TransactionSkeletonType, feeRate = BI.from(1000)): BI {
  return BI.from(
    common.__tests__.calculateFeeCompatible(common.__tests__.getTransactionSize(txSkeleton), BI.from(feeRate)),
  );
}

function getTxSkeletonFee(txSkeleton: TransactionSkeletonType): BI {
  const inputsTotal = txSkeleton.get('inputs').reduce((acc, cur) => acc.add(cur.cellOutput.capacity), BI.from(0));
  const outputsTotal = txSkeleton.get('outputs').reduce((acc, cur) => acc.add(cur.cellOutput.capacity), BI.from(0));

  return inputsTotal.sub(outputsTotal);
}

const offChainLock1: Script = {
  codeHash: '0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e',
  hashType: 'type',
  args: '0x11223344',
};

function createOnchainLock(args: string): Script {
  return {
    codeHash: '0xe1e2dab12f5bff4b282f428876714be021155baee934312dd08d298e5bb09f97',
    hashType: 'type',
    args,
  };
}

const onChainLocks1: Script = createOnchainLock('0x441509af');

const onChainLocks2: Script = createOnchainLock('0x25061223');
const onChainLocks3: Script = createOnchainLock('0x25061224');

function createFakeCellWithCapacity(
  capacity: number,
  lock = offChainLock1,
  type: Script | undefined = undefined,
  outpointIndex = 0,
  data = '0x',
): Cell {
  return {
    cellOutput: {
      capacity: BI.from(capacity).toHexString(),
      lock: lock,
      type,
    },
    outPoint: {
      // if we use bytes.hexify(Uint32LE.pack(outpointIndex)), it will throw error because many `0` before the number
      index: `0x${outpointIndex.toString(16)}`,
      txHash: '0xd2e09c658206d4d0d71c066c46eddaa568d49c09f76b7396ae803dad25850174',
    },
    data: data,
  };
}

const mockRpcRequest = jest.fn();

const mockProviderConfig: FullOwnershipProviderConfig = {
  ckb: {
    request: mockRpcRequest,
  } as any,
};

describe('class FullOwnershipProvider', () => {
  beforeEach(() => {
    mockRpcRequest.mockReset();
  });
  it('Should get live cells invoke `InjectedCkb#wallet_fullOwnership_getLiveCells`', async () => {
    mockRpcRequest.mockResolvedValue([]);
    const provider = new FullOwnershipProvider(mockProviderConfig);
    await expect(provider.getLiveCells({ cursor: '0x' })).resolves.toEqual([]);

    expect(provider['ckb'].request).toBeCalledWith({
      method: 'wallet_fullOwnership_getLiveCells',
      params: { cursor: '0x' },
    });
  });

  describe('#injectCapacity', () => {
    const emptyTxSkeleton = TransactionSkeleton();

    function initProviderWithCells(cells: Cell[], offChainLock = [offChainLock1]) {
      mockRpcRequest.mockImplementation(({ method, params }: { method: string; params: any }) => {
        switch (method) {
          case 'wallet_fullOwnership_getOffChainLocks':
            return offChainLock;
          case 'wallet_fullOwnership_getLiveCells':
            const cursor = parseInt(params.cursor || 0);
            return { objects: cells.slice(cursor, cursor + 1), cursor: cursor + 1 };
        }
      });
      const provider = new FullOwnershipProvider(mockProviderConfig);

      return provider;
    }

    it('Should throw error when all cells capacity is not enough', async () => {
      const provider = initProviderWithCells([createFakeCellWithCapacity(100 * 1e8), createFakeCellWithCapacity(200)]);

      await expect(provider.injectCapacity(emptyTxSkeleton, { amount: 400 * 1e8 })).rejects.toThrowError(
        /No cell sufficient to inject/,
      );
    });
    it('Should pick lock-only cell', async () => {
      const provider = initProviderWithCells([
        createFakeCellWithCapacity(500000 * 1e8, offChainLock1, offChainLock1),
        createFakeCellWithCapacity(500000 * 1e8, onChainLocks1, undefined, 0, '0x123321'),
        createFakeCellWithCapacity(500 * 1e8, offChainLock1),
        createFakeCellWithCapacity(200 * 1e8, onChainLocks2),
      ]);

      const skeleton = await provider.injectCapacity(emptyTxSkeleton, { amount: 144 * 1e8 });
      expect(skeleton.get('inputs').size).toBe(1);
      expect(skeleton.get('inputs').get(0)?.cellOutput.capacity).toBe(BI.from(500 * 1e8).toHexString());
      expect(skeleton.get('outputs').size).toBe(1);
      expect(skeleton.get('outputs').get(0)?.cellOutput.capacity).toBe(BI.from(500 * 1e8 - 144 * 1e8).toHexString());
    });

    it('Should pick one cell when capacity is enough', async () => {
      const provider = initProviderWithCells([
        createFakeCellWithCapacity(500 * 1e8),
        createFakeCellWithCapacity(200 * 1e8),
      ]);
      const skeleton = await provider.injectCapacity(emptyTxSkeleton, { amount: 144 * 1e8 });
      expect(skeleton.get('inputs').size).toBe(1);
      expect(skeleton.get('inputs').get(0)?.cellOutput.capacity).toBe(BI.from(500 * 1e8).toHexString());
      expect(skeleton.get('outputs').size).toBe(1);
      expect(skeleton.get('outputs').get(0)?.cellOutput.capacity).toBe(BI.from(500 * 1e8 - 144 * 1e8).toHexString());
    });

    it('Should pick multiple cells when single cell capacity is not enough', async () => {
      const provider = initProviderWithCells([
        createFakeCellWithCapacity(100 * 1e8, onChainLocks1, undefined, 0),
        createFakeCellWithCapacity(100 * 1e8, onChainLocks1, undefined, 0),
        createFakeCellWithCapacity(100 * 1e8, onChainLocks2, undefined, 1),
        createFakeCellWithCapacity(300 * 1e8, onChainLocks1, undefined, 2),
      ]);
      const skeleton = await provider.injectCapacity(emptyTxSkeleton, { amount: 250 * 1e8 });
      expect(skeleton.get('inputs').size).toBe(3);
      expect(skeleton.get('outputs').size).toBe(1);
      expect(skeleton.get('outputs').get(0)?.cellOutput.capacity).toBe(BI.from(500 * 1e8 - 250 * 1e8).toHexString());
    });

    it('Should throw error when changeLock is not found', async () => {
      const provider = initProviderWithCells([], []);
      // @ts-expect-error
      await expect(provider.injectCapacity()).rejects.toThrowError(
        'No change lock script found, it may be a internal bug',
      );
    });
  });

  describe('#payFee', () => {
    function buildProvider(cells: Cell[], offChainLocks = [offChainLock1]) {
      const provider = new FullOwnershipProvider(mockProviderConfig);
      mockRpcRequest.mockImplementation(({ method, params }) => {
        switch (method) {
          case 'wallet_fullOwnership_getOffChainLocks':
            return offChainLocks;
          case 'wallet_fullOwnership_getLiveCells':
            const cursor = parseInt(params.cursor || 0);
            return { objects: cells.slice(cursor, cursor + 4), cursor: cursor + 4 };
        }
      });

      return provider;
    }
    function createFakeSkeleton(inputCells: Cell[], outputCells: Cell[]) {
      const txSkeleton = TransactionSkeleton();
      return txSkeleton
        .update('inputs', (inputs) => inputs.push(...inputCells))
        .update('outputs', (outputs) => outputs.push(...outputCells))
        .update('cellDeps', (cellDeps) =>
          cellDeps.push({
            outPoint: {
              txHash: '0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37',
              index: '0x0',
            },
            depType: 'code',
          }),
        );
    }

    it('Automatically inject capacity when `autoInject` is true', async () => {
      const provider = buildProvider([createFakeCellWithCapacity(100 * 1e8), createFakeCellWithCapacity(200 * 1e8)]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(200 * 1e8, offChainLock1)],
        [createFakeCellWithCapacity(200 * 1e8, onChainLocks2)],
      );

      const withFee = await provider.payFee(txSkeleton, { autoInject: true });

      expect(withFee.get('inputs').size).toBe(2);
      expect(withFee.get('outputs').size).toBe(2);
      expect(getTxSkeletonFee(withFee)).toEqual(getExpectedFee(withFee));
    });

    it('Should throw error when autoInject is true but cell is not available', async () => {
      const provider = buildProvider([]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(200 * 1e8, offChainLock1)],
        [createFakeCellWithCapacity(200 * 1e8, onChainLocks2)],
      );
      // await provider.injectCapacity(txSkeleton, { amount: 150 });

      await expect(provider.payFee(txSkeleton, { autoInject: true })).rejects.toThrowError(
        'No cell sufficient to pay fee in your wallet',
      );
    });

    it('Should return directly when sum(inputs_capacity) - sum(outputs_capacity) ≥ fee', async () => {
      const provider = buildProvider([]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(200 * 1e8, offChainLock1)],
        [createFakeCellWithCapacity(100 * 1e8, onChainLocks2)],
      );

      await expect(provider.payFee(txSkeleton, { autoInject: true })).resolves.toEqual(txSkeleton);
    });

    it('Should use the provided `byOutputIndexes` cell for paying fee', async () => {
      const provider = buildProvider([]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(300 * 1e8, offChainLock1)],
        [
          createFakeCellWithCapacity(100 * 1e8, onChainLocks2),
          createFakeCellWithCapacity(100 * 1e8, onChainLocks2),
          createFakeCellWithCapacity(100 * 1e8, onChainLocks2),
        ],
      );
      const withFee = await provider.payFee(txSkeleton, { byOutputIndexes: [1, 2], autoInject: false });
      expect(withFee.inputs.size).toBe(1);
      expect(withFee.outputs.size).toBe(3);
      expect(getTxSkeletonFee(withFee)).toEqual(getExpectedFee(txSkeleton));
    });

    it('Should throw error when payer lock is not provided and auto inject is false', async () => {
      const provider = buildProvider([]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(100 * 1e8, offChainLock1)],
        [createFakeCellWithCapacity(100 * 1e8, onChainLocks2)],
      );
      await expect(provider.payFee(txSkeleton, { autoInject: false, byOutputIndexes: [] })).rejects.toThrowError(
        'no byOutputIndexes is provided, but autoInject is `false`',
      );
    });

    it('Should throw error when payer lock is not available and auto inject is false', async () => {
      const provider = buildProvider([createFakeCellWithCapacity(300 * 1e8, onChainLocks1)]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(300 * 1e8, offChainLock1)],
        [createFakeCellWithCapacity(300 * 1e8, offChainLock1), createFakeCellWithCapacity(300, onChainLocks2)],
      );
      await expect(provider.payFee(txSkeleton, { autoInject: false, byOutputIndexes: [1] })).rejects.toThrowError(
        'cells from `byOutputIndexes` sufficient to pay fee',
      );
    });

    it('Should throw error when byOutputIndexes is out of range', async () => {
      const provider = buildProvider([]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(300 * 1e8, offChainLock1)],
        [createFakeCellWithCapacity(300 * 1e8, offChainLock1)],
      );

      await (
        expect(provider.payFee(txSkeleton, { autoInject: false, byOutputIndexes: [114514] })) as any
      ).rejects.toThrowError('`byOutPutIndex` is out of range');
    });

    it('Should use wallet cell when `byOutputIndexes` is not sufficient', async () => {
      const provider = buildProvider([createFakeCellWithCapacity(100 * 1e8, onChainLocks1)]);
      const txSkeleton = createFakeSkeleton(
        [createFakeCellWithCapacity(190 * 1e8 + 100, offChainLock1)],
        [
          createFakeCellWithCapacity(100 * 1e8, onChainLocks2),
          createFakeCellWithCapacity(45 * 1e8 + 50, onChainLocks3),
          createFakeCellWithCapacity(45 * 1e8 + 50, onChainLocks3),
        ],
      );
      const withFee = await provider.payFee(txSkeleton, { autoInject: true, byOutputIndexes: [1, 2], feeRate: 1000 });
      expect(withFee.inputs.size).toBe(2);
      expect(withFee.outputs.size).toBe(4);

      expect(getTxSkeletonFee(withFee)).toEqual(getExpectedFee(withFee));
    });
  });

  it('#getLiveCells', async () => {
    mockRpcRequest.mockResolvedValue([]);
    const provider = new FullOwnershipProvider(mockProviderConfig);
    const params = { cursor: '0x', change: 'external' } as const;
    expect(await provider.getLiveCells(params)).toEqual([]);
    expect(mockRpcRequest).toBeCalledWith({
      method: 'wallet_fullOwnership_getLiveCells',
      params,
    });
  });

  describe('#collector', () => {
    function buildProvider(cells: Cell[], pageSize = 4) {
      const provider = new FullOwnershipProvider(mockProviderConfig);
      mockRpcRequest.mockImplementation(({ params }: { params: { cursor: string } }) => {
        const cursor = Number(params.cursor || 0);
        return {
          objects: cells.slice(cursor, cursor + pageSize),
          cursor: cursor + pageSize,
        };
      });

      return provider;
    }

    it('#should return paginated cell', async () => {
      const cellLists: any[] = [
        'cell1',
        'cell2',
        'cell3',
        'cell4',
        'cell5',
        'cell6',
        'cell7',
        'cell8',
        'cell9',
        'cell10',
        'cell11',
        'cell12',
      ];

      const provider = buildProvider(cellLists);

      let index = 0;
      for await (const cell of provider.collector()) {
        expect(cell).toEqual(`cell${index + 1}`);
        index++;
      }

      expect(mockRpcRequest).toBeCalledTimes(4);
      expect(mockRpcRequest).nthCalledWith(1, { method: 'wallet_fullOwnership_getLiveCells', params: { cursor: '' } });
      expect(mockRpcRequest).nthCalledWith(2, { method: 'wallet_fullOwnership_getLiveCells', params: { cursor: 4 } });
      expect(mockRpcRequest).nthCalledWith(3, { method: 'wallet_fullOwnership_getLiveCells', params: { cursor: 8 } });
      expect(mockRpcRequest).nthCalledWith(4, { method: 'wallet_fullOwnership_getLiveCells', params: { cursor: 12 } });
    });

    it('Should return specific lock cells', async () => {
      const provider = buildProvider([
        {
          cellOutput: {
            lock: onChainLocks1,
          },
        },
        {
          cellOutput: {
            lock: onChainLocks1,
          },
        },
        {
          cellOutput: {
            lock: onChainLocks2,
          },
        },
      ] as Cell[]);

      let count = 0;

      for await (const cell of provider.collector({ lock: onChainLocks1 })) {
        count++;
        expect(cell.cellOutput.lock).toEqual(onChainLocks1);
      }

      expect(count).toBe(2);
    });
  });

  describe('#Sign transaction', () => {
    const groupedSignature = [
      [
        onChainLocks2,
        '0x69000000100000006900000069000000550000005500000010000000550000005500000041000000d376d4bcb6539fe0e0b3d408556757183c75ccaf5c31b2486f9d0411217d41372828ed78e57d1cff7ffaeaf4870ebfdb338828175f8d197af203e7f4ac26924d00',
      ],
      [
        onChainLocks3,
        '0x5500000010000000550000005500000041000000a15ff63f3d55e6360a8ee9ce25fb77c320e5e23cbee767953a7291f9c3e1c222782d90079d5c86a238061e7c995b9fd61ccc45d77e5c0e6883e8dd0c5fc6078a00',
      ],
    ];

    it('Should put signature into witnesses', async () => {
      const emptyWitness = bytes.hexify(WitnessArgs.pack({}));
      const txSkeleton = TransactionSkeleton()
        .update('inputs', (inputs) => {
          return inputs.push(
            {
              cellOutput: { capacity: '0xaa', lock: onChainLocks1 },
              data: '0x',
              outPoint: { txHash: '0xe1cfb60b99b4a0b0b00240a3521ead04efdd96cd9a433819f72f33d150a6dadb', index: '0x0' },
            },
            {
              cellOutput: { capacity: '0xaa', lock: onChainLocks2 },
              data: '0x',
              outPoint: { txHash: '0xe1cfb60b99b4a0b0b00240a3521ead04efdd96cd9a433819f72f33d150a6dadb', index: '0x0' },
            },
            {
              cellOutput: { capacity: '0xaa', lock: onChainLocks3 },
              data: '0x',
              outPoint: { txHash: '0xe1cfb60b99b4a0b0b00240a3521ead04efdd96cd9a433819f72f33d150a6dadb', index: '0x0' },
            },
          );
        })
        .update('witnesses', (witnesses) => {
          return witnesses.push(emptyWitness, emptyWitness, emptyWitness);
        });

      const prepareSigningEntries = jest
        .spyOn(secp256k1Blake160, 'prepareSigningEntries')
        .mockImplementation((skeleton) => skeleton);
      const provider = new FullOwnershipProvider(mockProviderConfig);

      mockRpcRequest.mockReturnValue(groupedSignature);
      provider['getLumosConfig'] = jest.fn().mockReturnValue(predefined.LINA);

      const signedTxSkeleton = await provider.signTransaction(txSkeleton);
      expect(prepareSigningEntries).toHaveBeenCalledWith(txSkeleton, { config: predefined.LINA });

      expect(signedTxSkeleton.get('witnesses').get(0)).toBe(emptyWitness);

      signedTxSkeleton
        .get('witnesses')
        .slice(1)
        .forEach((witness, index) => {
          const lock = WitnessArgs.unpack(witness).lock;
          expect(lock).toEqual(groupedSignature[index][1]);
        });
      expect(signedTxSkeleton.get('signingEntries').size).toBe(0);
    });
  });

  // TODO: when get lumos config implementation is read, add more test
  it('#getLumosConfig', async () => {
    const provider = new FullOwnershipProvider(mockProviderConfig);
    await expect(provider['getLumosConfig']()).resolves.toBe(predefined.LINA);
  });

  describe('#parseLockScriptLike', () => {
    it('Should parse address', async () => {
      const provider = new FullOwnershipProvider(mockProviderConfig);
      provider['getLumosConfig'] = jest.fn().mockResolvedValue(predefined.AGGRON4);
      await expect(
        provider['parseLockScriptLike'](
          'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgxvk9qlymu894vugvgflwa967zjvud07qq4x3kf',
        ),
      ).resolves.toEqual(
        parseAddress(
          'ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgxvk9qlymu894vugvgflwa967zjvud07qq4x3kf',
          { config: predefined.AGGRON4 },
        ),
      );
    });

    it('Should return origin lock when input is a lock script', async () => {
      const provider = new FullOwnershipProvider(mockProviderConfig);
      await expect(provider['parseLockScriptLike'](onChainLocks1)).resolves.toBe(onChainLocks1);
    });
  });

  it('#getOffChainLocks and #getOnChainLocks', async () => {
    mockRpcRequest.mockReturnValue([]);
    const provider = new FullOwnershipProvider(mockProviderConfig);

    await expect(provider.getOffChainLocks({ change: 'internal' })).resolves.toEqual([]);
    expect(mockRpcRequest).toBeCalledWith({
      method: 'wallet_fullOwnership_getOffChainLocks',
      params: { change: 'internal' },
    });

    await expect(provider.getOnChainLocks({ cursor: '0' })).resolves.toEqual([]);
    expect(mockRpcRequest).toBeCalledWith({
      method: 'wallet_fullOwnership_getOnChainLocks',
      params: {
        cursor: '0',
      },
    });
  });
});
