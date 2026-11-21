<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['user_id']) && isset($_POST['searchmonth']))
{
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$approved_at = date('Y-m-d h:i:s');
	
	$userid=$_POST['userid'];
	$dis_user_id = $_POST["distributor_user_id"]; 
	$toder = $_POST['roster_json'];
	
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $fetch_product11)
	{
		$temp_id=$fetch_product11['roster_id'];
		$temp_shiftid=$fetch_product11['shift_id'];
	
		$query = mysqli_query($con,"SELECT * FROM tbl_user_shift_roster WHERE id='$temp_id' and user_id='$userid'");
		if(mysqli_num_rows($query)>0)
		{
			while($result = mysqli_fetch_array($query))
			{
				$res = mysqli_query($con,"INSERT INTO `tbl_user_shift_roster_history`(`user_id`, `shift_id`, `date`, `start_date`, `end_date`,`work_status`,`status`,`updated_by`,`remark`,`multiple_shift`,`inserted_at`) VALUES ('".$result['user_id']."','".$result['shift_id']."','".$result['date']."','".$result['start_date']."','".$result['end_date']."','".$result['work_status']."','".$result['status']."','$dis_user_id','".$result['remark']."','".$result['multiple_shift']."','$approved_at')");
				
				$uq1=mysqli_query($con,"UPDATE tbl_user_shift_roster SET shift_id='$temp_shiftid',updated_by='$dis_user_id', status='Updated' where id='$temp_id' and user_id='$userid'");
			}
		}
	}
	$response['success']='1';
	$response['message']="Update Roster Successful";
}
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}	
echo json_encode($response);
?>