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
	$dayend=date("t",strtotime($c_start));
	if($cdate1==date('Y-m'))
	{
		if(date('d')<$dayend)
		$dayend=date('d');
	}
	$attendance_detail=array();
	for($nm=1;$nm<=$dayend;$nm++) 
	{
		$curdate=date("Y-m-d", strtotime($cdate1."-".$nm));
		$query_check = mysqli_query($con,"select * from tbl_user_shift_roster where user_id='$cFOS' and date='$curdate' and work_status in ('Weekly Holiday','Holiday')");
		if(mysqli_num_rows($query_check)>0)
		{
			$fetch_query=mysqli_fetch_assoc($query_check);
			$attendance_detail['date']=$curdate;
			$attendance_detail['check_in_time']='';
			$attendance_detail['check_out_time']='';
			$attendance_detail['working_hours']='';
			$attendance_detail['status']=$fetch_query['work_status'];
			$response['attendance_detail'][]=$attendance_detail;
		}
		else 
		{
			$query_check_1 = mysqli_query($con,"select * from tbl_user_leave_detail where user_id='$cFOS' and start_date>='$curdate' and end_date<='$curdate' and status in ('Pending','Approved')");
			if(mysqli_num_rows($query_check_1)>0)
			{
				$fetch_query=mysqli_fetch_assoc($query_check_1);
				$attendance_detail['date']=$curdate;
				$attendance_detail['check_in_time']='';
				$attendance_detail['check_out_time']='';
				$attendance_detail['working_hours']='';
				$attendance_detail['status']=$fetch_query['status'];
				$response['attendance_detail'][]=$attendance_detail;
			}
			else 
			{
				$query2 = mysqli_query($con,"select * from tbl_user_attendance,tbl_user, tbl_user_attendance_detail where tbl_user_attendance.user_id=tbl_user.user_id and tbl_user_attendance.attendance_id=tbl_user_attendance_detail.attendance_id and tbl_user_attendance.user_id='$cFOS' and tbl_user_attendance.check_in_date='$curdate'");
				if(mysqli_num_rows($query2)>0)
				{    
					while($fetch_product2=mysqli_fetch_assoc($query2))
					{
						$attendance_detail['date']=$fetch_product2['check_in_date'];
						$attendance_detail['check_in_time']=$fetch_product2['check_in_time'];
						$attendance_detail['check_out_time']=$fetch_product2['check_out_time'];
						$attendance_detail['working_hours']=$fetch_product2['working_hours'];
						$attendance_detail['status']=$fetch_product2['attendance_status'];
						$response['attendance_detail'][]=$attendance_detail;
					}
				}
				else
				{
					$attendance_detail['date']=$curdate;
					$attendance_detail['check_in_time']='';
					$attendance_detail['check_out_time']='';
					$attendance_detail['working_hours']='';
					$attendance_detail['status']='Absent';
					$response['attendance_detail'][]=$attendance_detail;
				}
			}
		}
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