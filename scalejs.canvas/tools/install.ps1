param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'hammer' : 'Scripts/hammer',
		'scalejs.canvas' : 'Scripts/scalejs.canvas-$($package.Version)'
	}" |
	Add-ScalejsExtension 'scalejs.canvas' |
	Out-Null