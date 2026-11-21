<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['user_id']) && isset($_POST['searchmonth']))
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
	$cdate1=$_POST['searchmonth'];
	$c_start=$cdate1.'-01';
	$c_end=date("Y-m-t",strtotime($c_start));
	$roster_detail=array();
	$query_check = mysqli_query($con,"select *,tbl_user_shift_roster.id as ushiftid from tbl_user_shift_roster,tbl_shift_master where tbl_user_shift_roster.shift_id = tbl_shift_master.id and tbl_user_shift_roster.user_id='$cFOS' and tbl_user_shift_roster.date>='$c_start' and tbl_user_shift_roster.date<='$c_end' order by tbl_user_shift_roster.date asc");
	if(mysqli_num_rows($query_check)>0)
	{
		while($fetch_query=mysqli_fetch_assoc($query_check))
		{
			$roster_detail['roster_id']=$fetch_query['ushiftid'];
			$roster_detail['date']=$fetch_query['date'];
			$roster_detail['start_date']=$fetch_query['start_date'];
			$roster_detail['end_date']=$fetch_query['end_date'];
			$roster_detail['shift_time']=$fetch_query['shifttime_from'].' - '.$fetch_query['shifttime_to'];
			$roster_detail['work_status']=$fetch_query['work_status'];
			$roster_detail['status']=$fetch_query['status'];
			$response['roster_detail'][]=$roster_detail;
		}
	}
	else
	{
		$response['roster_detail']=$roster_detail;
	}
	
	$shiftroster=array();
	$res_fse = mysqli_query($con,"select * from tbl_shift_master where distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($res_fse)>0)
	{
		while($fetch_roster=mysqli_fetch_assoc($res_fse))
		{
			$shiftroster['shift_id']=$fetch_roster['id'];
			$shiftroster['shift_time_from']=$fetch_roster['shifttime_from'];
			$shiftroster['shift_time_to']=$fetch_roster['shifttime_to'];
			$shiftroster['shift_hours']=$fetch_roster['shift_hours'];
			$shiftroster['half_shift_hours']=$fetch_roster['half_shift_hours'];
			$shiftroster['status']=$fetch_roster['status'];
			$response['shiftroster'][]=$shiftroster;
		}
	}
	else
	{
		$response['shiftroster']=$shiftroster;
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