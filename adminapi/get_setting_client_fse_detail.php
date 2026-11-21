<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['total_order']) && isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$toder = $_POST['total_order'];
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$res_update = mysqli_query($con,"update tbl_user set billcancel_setting='No',update_datetime='$da' where distributor_id='$ver' and status!='Deleted'");
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$uid=$person_a['uid'];
		$res_update = mysqli_query($con,"update tbl_user set billcancel_setting='Yes',update_datetime='$da' where distributor_id='$ver' and user_id='$uid'");
	}
	$response['success']='1';
	$response['message']="Setting Successful Update";			
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>