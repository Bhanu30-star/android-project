<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['head_name']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$head_name=$_POST['head_name'];
	$head_category = isset($_POST['head_category']) ? $_POST['head_category'] : '';
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11=date("Y-m-d");
	$rs1=mysqli_query($con,"select * from tbl_expense_head where distributor_id='$session_dist_ver' and expense_head_name='$head_name'");
	if(mysqli_num_rows($rs1)<=0)
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_expense_head`(`distributor_id`, `expense_head_name`, `status`, `insert_date`, `expenses_category`) VALUES ('$session_dist_ver','$head_name','Active','$cdate11','$head_category')");
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT OPERATION,Added Expoense Head#Admin(INSERT)tbl_expense_head', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		$response['success']='1';
		$response['message']="Expense Head Successfully Inserted";
	}
	else
	{
		$response['success']='0';
		$response['message']="Head already exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>