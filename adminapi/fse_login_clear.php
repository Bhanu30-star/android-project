<?php
include("../../connect.php");
$response = array();
if(isset($_POST['fse_id']))
{
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');						
	$id1=$_POST['fse_id'];
	
	$res = mysqli_query($con,"select * from tbl_user where user_id='$id1'");
	while($ver1 = mysqli_fetch_assoc($res))
	{
		$imei_no=$ver1['imei_no'];
		$ip_address=$ver1['ip_address'];
		$carrier_name=$ver1['carrier_name'];
	}
	$stock_insert=mysqli_query($con,"INSERT IGNORE INTO tbl_user_history(user_id,imei_no,type,ip_address,carrier_name,datetime)values('$id1','$imei_no','login clear','$ip_address','$carrier_name','$da')");
	$que2=mysqli_query($con,"update tbl_user set imei_no='',ip_address='',carrier_name='' where user_id='$id1'");
	$response['success']='1';
	$response['details']="Login Detail Successfully Cleared";	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>