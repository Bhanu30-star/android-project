<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['status']) && isset($_POST['beat_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro=date("Y-m-d");
	$scri=date('H:i:sa');
	$bstatus = $_POST['status'];
	$bid = $_POST['beat_id'];
	$uq1=mysqli_query($con,"UPDATE tbl_distributor_beat SET status='$bstatus' where beat_id='$bid' and distributor_id='$session_dist_ver'");
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'UPDATE OPERATION,Edit beat status#Admin(UPDATE)tbl_distributor_beat', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	$response['success']='1';
	$response['details']="Beat status Successfully Updated";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>