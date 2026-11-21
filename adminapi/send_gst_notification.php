<?php
include("../../connect.php");
$path_to_fcm = "https://fcm.googleapis.com/fcm/send";
$SERVER_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";

$headers = array('Authorization:key='.$SERVER_KEY,'content-Type:application/json');

	$title = "जुलाई 2020 GST रिपोर्ट";
	$message = "जुलाई 2020 की GST रिपोर्ट  जेनेरेट  हो  गयी  है । आप  अपनी  GST फाइल  करे , डाटा  को  डबल  चेक  करते  हुए ।";

	$res = mysqli_query($con,"SELECT device_id FROM tbl_distributor_users WHERE distributor_id IN (61,96,140,156,165,184,185,189,195,207,220,240,274,280,281,282,290,293,305,322,326,336,345,351,373,406,407,417,425,429,430,433,438,442,443,446,453,464,465,468,475,478,484,497,519,533,535,536,545,547,550,554,556,567,569,570,571,572,573,581,583,586,589,590,593,601,604,605,607,608,615,621,623,627,634,638,659,666,688,701,708,730,731,733,738,743,744,749,764,765,766,767,769,770,771,778,782,801,824,826,850,851,855,858,901,903,910,914,927,928,934,936,937,941,942,945,948,950,957,962,970,972,985,1012,1016,1017,1034,1041,1049,1066,1070,1072,1076,1082,1083,1093,1104,1108,1111,1114,1118,1127,1128,1143,1151,1155,1164,1183,1186,1187,1198,1202,1243,1248,1250,1254,1264,1267,1276,1293,1304,1307,1309,1312,1314,1316,1317,1328,1330,1331,1334,1340,1345,1346,1350,1351,1355,1358,1359,1367,1371,1376,1405,1418,1423,1424,1425,1447,1475,1522,1573,1652,1655,1666,1669,1686,1708,1769,1788,1857,1866,1917,2557,3288,3719,1574)");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_res=mysqli_fetch_assoc($res))
		{	
			$key = $fetch_res['device_id'];

			$fields = array('to'=>$key,'notification'=>array('title'=>$title,'body'=>$message),'priority'=>'high');
			
			$payload = json_encode($fields);
			$curl_session = curl_init();
			curl_setopt($curl_session, CURLOPT_URL, $path_to_fcm);
			curl_setopt($curl_session, CURLOPT_POST, true);
			curl_setopt($curl_session, CURLOPT_HTTPHEADER, $headers);
			curl_setopt($curl_session, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($curl_session, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($curl_session, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
			curl_setopt($curl_session, CURLOPT_POSTFIELDS, $payload);
			echo $resp = curl_exec($curl_session);
		}	
	}
?>