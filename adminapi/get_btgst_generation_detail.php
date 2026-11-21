<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_user_id']))
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
	$scro = date("m");
	$da  = date("Y");
	$dis_uid = $_POST['distributor_user_id'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{	
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	$purchasebook=array();
	$res = mysqli_query($con,"select * from tbl_bthawk_gst_generation order by year,month asc");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		$purchasebook['month_name']=$fetch_product['month_name'];
		$purchasebook['month']=$fetch_product['month'];
		$purchasebook['year']=$fetch_product['year'];
		$purchasebook['status']=$fetch_product['status'];
		$response['gst_detail'][]=$purchasebook;
	}
	$response['success']='1';
	$response['details']="Detail Successfully Fetch";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>