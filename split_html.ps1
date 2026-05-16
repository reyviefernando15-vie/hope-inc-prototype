$c = [System.IO.File]::ReadAllText('index.html')
$start = $c.IndexOf('<style>')
$end = $c.IndexOf('</style>') + 8
$styleBlock = $c.Substring($start, $end - $start)
$c = $c.Replace($styleBlock, '<link rel="stylesheet" href="style.css">')

$start2 = $c.IndexOf('<script>')
$end2 = $c.LastIndexOf('</script>') + 9
$scriptBlock = $c.Substring($start2, $end2 - $start2)
$c = $c.Replace($scriptBlock, '<script src="script.js"></script>')

[System.IO.File]::WriteAllText('index.html', $c)
