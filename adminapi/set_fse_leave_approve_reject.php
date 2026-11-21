<?php
include("../../connect.php"); 
date_default_timezone_set('Asia/Calcutta');
$clientIP = $_SERVER['REMOTE_ADDR'];
$apiUrl = "http://ipinfo.io/{$clientIP}/json";
$response1 = file_get_contents($apiUrl);
$details = json_decode($response1, true);
if($details['country']=='AE')
{
	date_default_timezone_set('Asia/Dubai');
}
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['leave_id']) && isset($_POST['approve_remark']))
{
	$approved_at = date('Y-m-d h:i:s');
	$leave_id=$_POST['leave_id'];
	$dis_user_id = $_POST["distributor_user_id"]; 
	$remark = mysqli_real_escape_string($con,$_POST['approve_remark']);
	
	$query = mysqli_query($con,"SELECT * FROM tbl_user_leave_detail WHERE history_id='$leave_id'");
    $result = mysqli_fetch_array($query);
    $fse_id = $result['user_id'];
	$query_cc = mysqli_query($con,"SELECT * FROM tbl_user WHERE user_id='$fse_id'");
    $fetch_cc = mysqli_fetch_array($query_cc);
	
    $qry = mysqli_query($con,"UPDATE `tbl_user_leave_detail` SET approved_by='$dis_user_id',approved_at='$approved_at',manager_remark='$remark',status='Approved' WHERE history_id='$leave_id'");
	$response['success']='1';
	$response['message']="Approve Leave Successful";
}
else if(isset($_POST['distributor_user_id']) && isset($_POST['leave_id']) && isset($_POST['reject_remark']))
{
	$approved_at = date('Y-m-d h:i:s');
	$dis_user_id = $_POST["distributor_user_id"]; 
    $leave_id = $_POST['leave_id'];
    $remark = mysqli_real_escape_string($con,$_POST['reject_remark']);
    $query = mysqli_query($con,"SELECT * FROM tbl_user_leave_detail WHERE history_id='$leave_id'");
    $result = mysqli_fetch_array($query);
    $fse_id = $result['user_id'];
	$query_cc = mysqli_query($con,"SELECT * FROM tbl_user WHERE user_id='$fse_id'");
    $fetch_cc = mysqli_fetch_array($query_cc);
    $qry = mysqli_query($con,"UPDATE `tbl_user_leave_detail` SET approved_by='$dis_user_id',approved_at='$approved_at',manager_remark='$remark',status='Rejected' WHERE history_id='$leave_id'");
	$response['success']='1';
	$response['message']="Reject Leave Successful";
}	
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}
echo json_encode($response);
?>