param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'hammer, scalejs.canvas' |
	Remove-ScalejsExtension 'scalejs.canvas' |
	Out-Null
