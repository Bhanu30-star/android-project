<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
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
	$cdate1 = isset($_POST['searchdate1']) ? $_POST['searchdate1'] : date("Y-m-d");
	
	$attendance_detail=array();
	$query_user = mysqli_query($con,"select * from tbl_user where distributor_id='$session_dist_ver' and status='Active'");
	if(mysqli_num_rows($query_user)>0)
	{
		while($fetch_user=mysqli_fetch_assoc($query_user))
		{
			$cFOS=$fetch_user['user_id'];
			$query_present = mysqli_query($con,"select * from tbl_user_attendance where user_id='$cFOS' and check_in_date='$cdate1'");
			if(mysqli_num_rows($query_present)>0)
			{
				$fetch_present=mysqli_fetch_assoc($query_present);
				$attendance_detail['user_name']=$fetch_user['user_name'];
				$attendance_detail['date']=$cdate1;
				$attendance_detail['check_in_time']=$fetch_present['check_in_time'];
				$attendance_detail['status']='Present';
				$response['attendance_detail'][]=$attendance_detail;
			}
			else
			{
				$query_check_1 = mysqli_query($con,"select * from tbl_user_leave_detail where user_id='$cFOS' and start_date<='$cdate1' and end_date>='$cdate1' and status in ('Pending','Approved')");
				if(mysqli_num_rows($query_check_1)>0)
				{
					$fetch_query=mysqli_fetch_assoc($query_check_1);
					$attendance_detail['user_name']=$fetch_user['user_name'];
					$attendance_detail['date']=$cdate1;
					$attendance_detail['check_in_time']='';
					$attendance_detail['status']='Leave';
					$response['attendance_detail'][]=$attendance_detail;
				}
				else
				{
					$attendance_detail['user_name']=$fetch_user['user_name'];
					$attendance_detail['date']=$cdate1;
					$attendance_detail['check_in_time']='';
					$attendance_detail['status']='Absent';
					$response['attendance_detail'][]=$attendance_detail;
				}
			}
		}
	}
					
	$leave_detail=array();		
	$query_user1 = mysqli_query($con,"select * from tbl_user where distributor_id='$session_dist_ver' and status='Active'");
	if(mysqli_num_rows($query_user1)>0)
	{
		$leave_alag=0;
		while($fetch_user=mysqli_fetch_assoc($query_user1))
		{
			$cFOS=$fetch_user['user_id'];
			$query_check = mysqli_query($con,"select * from tbl_user_leave_detail where user_id='$cFOS' and start_date<='$cdate1' and end_date>='$cdate1'");
			if(mysqli_num_rows($query_check)>0)
			{    
				while($fetch_product2=mysqli_fetch_assoc($query_check))
				{
					$leave_alag=1;
					$leave_detail['history_id']=$fetch_product2['history_id'];
					$leave_detail['user_id']=$cFOS;
					$leave_detail['user_name']=$fetch_user['user_name'];
					$leave_detail['leave_type']=$fetch_product2['leave_type'];
					$leave_detail['start_date']=$fetch_product2['start_date'];
					$leave_detail['end_date']=$fetch_product2['end_date'];
					$leave_detail['no_of_days']=$fetch_product2['no_of_days'];
					$leave_detail['halfday_type']=$fetch_product2['halfday_type'];
					$leave_detail['description']=$fetch_product2['description'];
					$leave_detail['status']=$fetch_product2['status'];
					$response['leave_detail'][]=$leave_detail;
				}
			}
		}
	}
	if($leave_alag==0)
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