<?php
/***************************************************************
File Name: create_log.php
Creation Date: 26-December-2017
Author: Shilpa Khandelwal
Version: 1.1
Purpose: To saved each and every api call transaction detail
Last Updated On: 26-December-2017
Old Version: 1.0
Update done: 1.0 to 1.1
1. Added Error Handling (26-December-2017)
2. Enabled Logging (26-December-2017)
****************************************************************/
ob_start();
error_reporting(0);
class Log
{
	function createLog($file, $txtdata)
	{
		// Open the file to get existing content
		$current = file_get_contents($file);
		// Append a new log data to the file
		$current .= $txtdata;
		// Write the contents back to the file
		if (file_put_contents($file, $current))
		{
			return 1;
		}
		  else
		{
			return 0;
		}
	}
}
?>
