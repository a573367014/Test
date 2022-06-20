# Changelog

## [Unreleased]

## [0.2.10] - 2019-08-01
### Changed
- 混淆输出的代码。

## [0.2.9] - 2019-07-31
### Changed
- 暴露字体文字所包含的字。

## [0.2.8] - 2019-07-09
### Added
- 添加 extrudeScale 功能。

## [0.2.7] - 2019-07-05
### Changed
- 修改侧面 UI 算法。

## [0.2.6] - 2019-07-01
### Changed
- 修改 z 轴方向缩放膨胀默认值。

## [0.2.5] - 2019-07-01
### Added
- 新的侧面 uv 算法，沿 contour 方向展开侧面网格。
- 添加字体 z 轴方向缩放膨胀的功能。（未暴露参数

## [0.2.4] - 2019-06-25
### Fixed
- 修复 `uvs[0] is not defined`。

## [0.2.3] - 2019-06-25
### Changed
- worker 捕获错误将会抛出。

## [0.2.2] - 2019-06-20
### Changed
- 暂时移除 `poly2tri`。
### Fixed
- 修复打包错误导致无法加载。

## [0.2.1] - 2019-06-20
### Fixed
- 修复 debug 对象不可用。

## [0.2.0] - 2019-06-20
### Added
- 支持 debug 模式。

## [0.1.2] - 2019-06-19
### Fixed
- 修复频繁初始化 worker。

## [0.1.1] - 2019-06-19
### Changed
- 合并顶点数据。

## [0.1.0] - 2019-06-14
### Added
- 支持 worker 进行运算。
- 参数 `CurveSegments` 改为 `CurveSegmentsAdaptive`.

## [0.0.4] - 2019-06-11
### Added
- 支持 `ShadingSmoothAngle`.

## [0.0.3] - 2019-06-05
### Changed
- 修复某些字镂空, 例如“货”。

## [0.0.2] - 2019-06-03
### Changed
- 反相 `extrudeOffsetX` 参数方向。
- 使用 `typedArray` 提升性能。

## [0.0.1] - 2019-05-31
### Added
- 支持输入字体文件，输出 model。

