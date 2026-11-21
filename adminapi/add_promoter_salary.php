<?php
include("../../connect.php");
$response = array();
if(isset($_POST['user_id']) && isset($_POST['distributor_id']) && isset($_POST['monthperiod']) && isset($_POST['basemamount']) && isset($_POST['finalpayamt']))
{
	$temp_id=1;
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$executivename = trim($_POST['user_id'] ?? '');
    $monthperiod = trim($_POST['monthperiod'] ?? '');
	$basemamount = trim($_POST['basemamount'] ?? '');
	$expensemamount = trim($_POST['expensemamount'] ?? '');
	$arrearamount = trim($_POST['arrearamount'] ?? '');
	$deductionamount = trim($_POST['deductionamount'] ?? '');
	$finalpayamt = trim($_POST['finalpayamt'] ?? '');
	$remark = trim($_POST['remark'] ?? '');
    $insert_date = date("Y-m-d");
	$insert_time = date("H-i-sa");
	
	$checkQuery = mysqli_query($con, "SELECT * FROM tbl_promoter_salary_detail WHERE distributor_id = '$session_dist_ver'  AND user_id='$executivename' and month = '$monthperiod' AND status = 'Active'");
    if (mysqli_num_rows($checkQuery) > 0) 
	{
		$response['success']=0;
		$response['details']="Salary detail already exists.";
	}
	else
	{
		$query = mysqli_query($con, "INSERT INTO `tbl_promoter_salary_detail`(`distributor_id`, `user_id`, `month`, `transaction_date`, `transaction_time`, `amount`, `expense_amt`, `addition_amt`, `deduction_amt`, `final_payble_amt`, `remark`, `status`) VALUES ('$session_dist_ver', '$executivename','$monthperiod','$insert_date','$insert_time','$basemamount','$expensemamount','$arrearamount','$deductionamount','$finalpayamt','$remark', 'Active')");
		$response['success']='1';
		$response['details']="Salary Detail successfully uploaded!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>