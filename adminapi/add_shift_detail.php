<?php
$response = array();
include("../../connect.php"); 
if($_POST['distributor_id']!=0 && $_POST['shift_start']!='' && $_POST['shift_end']!='')
{  
	$session_dist_ver = $_POST['distributor_id'];
	$shift_start=$_POST['shift_start'];
	$shift_end=$_POST['shift_end'];
	$shift_hours_val=$_POST['shift_hours_val'];		
	$half_shift=$_POST['half_shift'];	
			
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	
	$res_check = mysqli_query($con,"SELECT * FROM tbl_shift_master where distributor_id='$session_dist_ver' and shifttime_from='$shift_start' and shifttime_to='$shift_end'");
	if(mysqli_num_rows($res_check)==0)
	{		
		$upadte_shift = mysqli_query($con,"UPDATE tbl_shift_master SET status = 'Deactive' WHERE distributor_id ='$session_dist_ver'");
		
		$query = mysqli_query($con,"INSERT INTO `tbl_shift_master`(`distributor_id`, `shifttime_from`, `shifttime_to`, `shift_hours`, `half_shift_hours`, `status`) VALUES ('$session_dist_ver','$shift_start','$shift_end','$shift_hours_val','$half_shift','Active')");

		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver', 'INSERT+UPDATE OPERATION,Add Shift Detail#Admin(INSERT+UPDATE)tbl_shift_master', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		
		$response['success'] = 1;
		$response['details'] = 'Shift Successfully Inserted!!';
	}
	else
	{
		$response['success'] = 0;
		$response['details'] = "Shift Already Available!!";
	}
}
else
{
	$response['success'] = 0;
	$response['details'] = "Required Field Missing";
}		
echo json_encode($response);
?> 