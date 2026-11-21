<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['detail_id']) && isset($_POST['status']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$d_id = $_POST['detail_id'];
	$status = $_POST['status'];
	$res_check = mysqli_query($con,"select * from tbl_distributor_operator_detail where distributor_id='$session_dist_ver' and detail_id='$d_id'");
	if(mysqli_num_rows($res_check)>0)
	{
		$res_update = mysqli_query($con,"update tbl_distributor_operator_detail set status='$status' where distributor_id='$session_dist_ver' and detail_id='$d_id'");
		
		$response['success']='1';
	    $response['message']="Status Successful Updated";
	}
	else
	{
	  $response['success']='0';
	  $response['message']="Operator Detail Not Exists";	
	}
}
else 
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>