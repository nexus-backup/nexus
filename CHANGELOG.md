# v0.0.12 (Thu Apr 13 2023)

#### 🚀 Enhancement

- chore: fix bump failed since git commit failed [#11](https://github.com/nexus-backup/nexus/pull/11) ([@homura](https://github.com/homura))
- `@nexus-wallet-backup/ownership-providers`, `@nexus-wallet-backup/protocol`, `@nexus-wallet-backup/utils`
  - chore: bump manifest version in ci [#10](https://github.com/nexus-backup/nexus/pull/10) ([@homura](https://github.com/homura))

#### ⚠️ Pushed to `main`

- chore: run check via lerna ([@homura](https://github.com/homura))
- chore: update dependencies ([@homura](https://github.com/homura))
- chore: update lock file ([@homura](https://github.com/homura))
- chore: e2e as private package ([@homura](https://github.com/homura))
- chore: unnecessary lumos config ([@homura](https://github.com/homura))
- Merge remote-tracking branch 'ckb-js/main' into lerna-publish ([@homura](https://github.com/homura))
- fix: build failed since miss npm token ([@homura](https://github.com/homura))
- fix: build failed since miss browserify ([@homura](https://github.com/homura))
- `@nexus-wallet-backup/ownership-providers`, `@nexus-wallet-backup/protocol`, `@nexus-wallet-backup/utils`
  - docs: readme for npm ([@homura](https://github.com/homura))
  - chore: bump version ([@homura](https://github.com/homura))
  - chore: lerna to publish modules ([@homura](https://github.com/homura))
- `@nexus-wallet-backup/ownership-providers`
  - fix(ownership-provider): build failed since cannot find entry ([@homura](https://github.com/homura))
  - refactor(ownership-providers): reduce dependencies by replacing lodash equal ([@homura](https://github.com/homura))
- `@nexus-wallet-backup/utils`
  - chore: build with lerna to simplify scripts ([@homura](https://github.com/homura))
- `@nexus-wallet-backup/ownership-providers`, `@nexus-wallet-backup/protocol`
  - chore: unnecessary lumos submodule ([@homura](https://github.com/homura))

#### Authors: 1

- Yonghui Lin ([@homura](https://github.com/homura))

---

# v0.0.10 (Mon Apr 10 2023)

#### 🔨 Breaking Minor Change

- feat: ownership provider to work with Lumos [#127](https://github.com/ckb-js/nexus/pull/127) ([@homura](https://github.com/homura) [@IronLu233](https://github.com/IronLu233))

#### 🐛 Bug Fix

- fix: getLiveCells returns specified change type cells [#183](https://github.com/ckb-js/nexus/pull/183) ([@zhangyouxin](https://github.com/zhangyouxin))
- feat(extension-chrome): optimize displaying amount of asset [#187](https://github.com/ckb-js/nexus/pull/187) ([@IronLu233](https://github.com/IronLu233))

#### Authors: 3

- Iron Lu ([@IronLu233](https://github.com/IronLu233))
- Shinya ([@zhangyouxin](https://github.com/zhangyouxin))
- Yonghui Lin ([@homura](https://github.com/homura))

---

# v0.0.9 (Tue Apr 04 2023)

#### 🐛 Bug Fix

- fix: UI bugs and improvements [#177](https://github.com/ckb-js/nexus/pull/177) ([@IronLu233](https://github.com/IronLu233))

#### Authors: 1

- Iron Lu ([@IronLu233](https://github.com/IronLu233))

---

# v0.0.8 (Fri Mar 31 2023)

#### 🚀 Enhancement

- feat: supported get blockchain info rpc [#168](https://github.com/ckb-js/nexus/pull/168) ([@homura](https://github.com/homura))

#### 🐛 Bug Fix

- chore(extension-chrome): remove unnecessary accessible [#173](https://github.com/ckb-js/nexus/pull/173) ([@homura](https://github.com/homura))
- fix: return cells with invalid lock args [#171](https://github.com/ckb-js/nexus/pull/171) ([@zhangyouxin](https://github.com/zhangyouxin))
- fix(extension-chrome): enable for http and local site [#174](https://github.com/ckb-js/nexus/pull/174) ([@homura](https://github.com/homura))

#### 📝 Documentation

- docs: new readme [#175](https://github.com/ckb-js/nexus/pull/175) ([@zhangyouxin](https://github.com/zhangyouxin))

#### Authors: 2

- Shinya ([@zhangyouxin](https://github.com/zhangyouxin))
- Yonghui Lin ([@homura](https://github.com/homura))

---

# v0.0.7 (Tue Mar 28 2023)

#### 🐛 Bug Fix

- fix: retry not work in backend [#167](https://github.com/ckb-js/nexus/pull/167) ([@zhangyouxin](https://github.com/zhangyouxin))

#### Authors: 1

- Shinya ([@zhangyouxin](https://github.com/zhangyouxin))

---

# v0.0.6 (Tue Mar 28 2023)

#### 🐛 Bug Fix

- feat(extension-chrome): Use Chrome extension favicon API for whitelist and grant [#122](https://github.com/ckb-js/nexus/pull/122) ([@IronLu233](https://github.com/IronLu233))

#### Authors: 1

- Iron Lu ([@IronLu233](https://github.com/IronLu233))

---

# v0.0.5 (Tue Mar 28 2023)

#### 🐛 Bug Fix

- fix: connect status is always connected [#157](https://github.com/ckb-js/nexus/pull/157) ([@IronLu233](https://github.com/IronLu233))

#### 🏠 Internal

- refactor: disable unsafe any access [#138](https://github.com/ckb-js/nexus/pull/138) ([@IronLu233](https://github.com/IronLu233))

#### 📝 Documentation

- docs: faq [#150](https://github.com/ckb-js/nexus/pull/150) ([@homura](https://github.com/homura))

#### Authors: 2

- Iron Lu ([@IronLu233](https://github.com/IronLu233))
- Yonghui Lin ([@homura](https://github.com/homura))

---

# v0.0.4 (Mon Mar 27 2023)

#### 🔨 Breaking Minor Change

- feat: sign data with a magic prefix for security [#139](https://github.com/ckb-js/nexus/pull/139) ([@zhangyouxin](https://github.com/zhangyouxin))

#### 🏠 Internal

- chore: prevent canary release in PR from forked repo [#147](https://github.com/ckb-js/nexus/pull/147) ([@homura](https://github.com/homura))

#### Authors: 2

- Shinya ([@zhangyouxin](https://github.com/zhangyouxin))
- Yonghui Lin ([@homura](https://github.com/homura))

---

# v0.0.3 (Thu Mar 23 2023)

#### 🐛 Bug Fix

- fix(extension-chrome): fix typo and whitelist UI overflow [#142](https://github.com/ckb-js/nexus/pull/142) ([@IronLu233](https://github.com/IronLu233))

#### Authors: 1

- Iron Lu ([@IronLu233](https://github.com/IronLu233))

---

# v0.0.2 (Thu Mar 23 2023)

#### 🔨 Breaking Minor Change

- feat(extension-chrome): validate RPC methods input parameters [#110](https://github.com/ckb-js/nexus/pull/110) ([@IronLu233](https://github.com/IronLu233))

#### 🚀 Enhancement

- feat: a protocol pkg to standardize communication [#126](https://github.com/ckb-js/nexus/pull/126) ([@homura](https://github.com/homura))

#### 🏠 Internal

- chore: bypass protect branch [#140](https://github.com/ckb-js/nexus/pull/140) ([@homura](https://github.com/homura))
- chore: auto build when pr or push [#136](https://github.com/ckb-js/nexus/pull/136) ([@homura](https://github.com/homura))

#### Authors: 2

- Iron Lu ([@IronLu233](https://github.com/IronLu233))
- Yonghui Lin ([@homura](https://github.com/homura))
