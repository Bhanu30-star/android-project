<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['detail_id']) && isset($_POST['operator_name']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$d_id = $_POST['detail_id'];
	$operator_name = $_POST['operator_name'];
	
	$res_check = mysqli_query($con,"select * from tbl_distributor_operator_detail where distributor_id='$session_dist_ver' and operator_name='$operator_name'");
	if(mysqli_num_rows($res_check)==0)
	{
		$res_update = mysqli_query($con,"update tbl_distributor_operator_detail set operator_name='$operator_name' where distributor_id='$session_dist_ver' and detail_id='$d_id'");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'UPDATE OPERATION,Edit Distributor Operator Detail#Admin(UPDATE)tbl_distributor_operator_detail', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		$response['success']='1';
	    $response['message']="Detail Successful Updated";
	}
	else
	{
	  $response['success']='0';
	  $response['message']="Operator Detail Already Exists";	
	}
}
else 
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>