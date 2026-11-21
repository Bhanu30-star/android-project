<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['user_id']) && isset($_POST['password']))
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
	
	$cdate  = date("Y-m-d");
	$usrid = $_POST['user_id'];
	$password = $_POST['password'];
	$rs=mysqli_query($con,"select user_password from tbl_user where user_id='$usrid'");
	$fos_data=mysqli_fetch_assoc($rs);
	if(mysqli_num_rows($rs)>0)
	{										
		$query = mysqli_query($con,"INSERT IGNORE INTO  tbl_user_history(user_id,password,datetime)values('$usrid','".$fos_data['user_password']."','$cdate')");
		$uq1=mysqli_query($con,"update tbl_user set user_password='$password',imei_no='' where user_id='$usrid'"); 
		$response['success']='1';
		$response['details']="Password changed successfully";
	}
	else
	{
		$response['success']='0';
		$response['details']="Password not changed..Please check and try again later!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>