<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['beat_name']) && isset($_POST['beat_id']))
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
	$bid = $_POST['beat_id'];
	$b_name = $_POST['beat_name'];
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_beat where beat_id!='$bid' and beat_name='$b_name' and distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($res_product_stock1)<=0)
	{
		$res_product = mysqli_query($con,"SELECT * FROM  tbl_distributor_beat where beat_id='$bid'");
		while($fetch_product11=mysqli_fetch_assoc($res_product))
		{
			$pname1=$fetch_product11['beat_name'];
			$pstatus=$fetch_product11['status'];
			$query = mysqli_query($con,"INSERT INTO `tbl_distributor_beat_history`(`beat_id`, `distributor_id`, `beat_name`, `status`, `insert_date`, `insert_time`) VALUES ('$bid','$session_dist_ver','$pname1','$pstatus','$scro','$scri')");
		}
		$uq1=mysqli_query($con,"UPDATE tbl_distributor_beat SET beat_name='$b_name' where beat_id='$bid' and distributor_id='$session_dist_ver'");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT+UPDATE OPERATION,Add Beat history#Admin(INSERT)tbl_distributor_beat_history,(UPDATE)tbl_distributor_beat', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");

		$response['success']='1';
		$response['details']="Beat Detail Updated Successfully";
	}
	else
	{
		 $response['success']='0';
		 $response['details']="Beat Detail Already Exists";	
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>