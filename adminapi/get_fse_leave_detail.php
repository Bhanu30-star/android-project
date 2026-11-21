<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['user_id']))
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
	$cFOS=$_POST['user_id'];
	$leave_detail=array();
	$query_check = mysqli_query($con,"select * from tbl_user_leave_detail where user_id='$cFOS'");
	if(mysqli_num_rows($query_check)>0)
	{    
		while($fetch_product2=mysqli_fetch_assoc($query_check))
		{
			$leave_detail['history_id']=$fetch_product2['history_id'];
			$leave_detail['leave_type']=$fetch_product2['leave_type'];
			$leave_detail['apply_date']=$fetch_product2['apply_date'];
			$leave_detail['start_date']=$fetch_product2['start_date'];
			$leave_detail['end_date']=$fetch_product2['end_date'];
			$leave_detail['no_of_days']=$fetch_product2['no_of_days'];
			$leave_detail['halfday_type']=$fetch_product2['halfday_type'];
			$leave_detail['description']=$fetch_product2['description'];
			$leave_detail['status']=$fetch_product2['status'];
			$response['leave_detail'][]=$leave_detail;
		}
	}
	else
	{
		$response['leave_detail']=$leave_detail;
	}
	
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}	
echo json_encode($response);
?>