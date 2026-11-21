<?php
include("../../connect.php");
$response = array();
function distance($lat1, $lon1, $lat2, $lon2, $unit)
{
	if (($lat1 == $lat2) && ($lon1 == $lon2)) {
		return 0;
	}
	else {
		$theta = $lon1 - $lon2;
		$dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
		$dist = acos($dist);
		$dist = rad2deg($dist);
		$miles = $dist * 60 * 1.1515;
		$unit = strtoupper($unit);

		if ($unit == "K") {
			return ($miles * 1.609344);
		} else if ($unit == "N") {
		return ($miles * 0.8684);
		} else {
			return $miles;
		}
	}
}
if(isset($_POST['user_id']) && isset($_POST['cdate']))
{
	$userid=$_POST['user_id'];
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
	$cdate = isset($_POST['cdate']) ? $_POST['cdate'] : $da;
	$res = mysqli_query($con,"select * from tbl_party_user_attendance,tbl_user,tbl_party where tbl_party_user_attendance.user_id=tbl_user.user_id and tbl_party_user_attendance.party_id=tbl_party.party_id and tbl_user.user_id='$userid' and insert_date='$cdate' order by tbl_party_user_attendance.history_id DESC");
	$attendancebook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$check_in_distance = distance(floatval($fetch_product['latitude']), -floatval($fetch_product['longitude']), floatval($fetch_product['party_latitude']), -floatval($fetch_product['party_longitude']), "K")*1000;
			
			$attendancebook['history_id']=$fetch_product['history_id'];
			$attendancebook['user_name']=$fetch_product['user_name'];
			$attendancebook['party_name']=$fetch_product['party_name'];
			$attendancebook['latitude']=$fetch_product['latitude'];
			$attendancebook['longitude']=$fetch_product['longitude'];
			$attendancebook['lat_long_difference']=round($check_in_distance,2);
			if($check_in_distance<500) { $val_flag='Yes'; } else { $val_flag='No'; }
			$attendancebook['checkin_flag']=$val_flag;
			$attendancebook['insert_date']=$fetch_product['insert_date'];
			$attendancebook['insert_time']=$fetch_product['insert_time'];
			$response['attendancebook'][]=$attendancebook;
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{		
		$response['success']='0';
		$response['details']="No attendance available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>