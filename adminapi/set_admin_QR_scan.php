<?php
include("../../connect.php");
$response = array();
if(isset($_POST['tokenid']) && isset($_POST['distributor_id']))
{
	$changes_flag=1;
	$targetToken = base64_decode($_POST['tokenid']);
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:sa");				
	$cdate  = date("Y-m-d");				     
	$cdate11 =$cdate.' '.$scro;
	
	$res_checking = mysqli_query($con,"select * from tbl_random_qr_generator where token_id='$targetToken'");
	if(mysqli_num_rows($res_checking)>0)
	{
		$res_checking_1 = mysqli_query($con,"select * from tbl_random_qr_generator where token_id='$targetToken' and status='Pending'");
		if(mysqli_num_rows($res_checking_1)>0)
		{
			while($fetch_checking=mysqli_fetch_assoc($res_checking_1))
			{   
				$insertdate = $fetch_checking['inserted_at'];
				$insertTime = strtotime($insertdate);
				$currentTime = time();

				// Difference in seconds
				$diff = $currentTime - $insertTime;

				// Check if more than 1 minutes (60 seconds)
				if ($diff > 60) {
					$response['success']='0';
					$response['details']="QR-Code is Expired";
				}
				else
				{
					$uq2_logo = mysqli_query($con, "UPDATE `tbl_distributor_users` SET login_token_id = '$targetToken',token_generate_time='$cdate11' WHERE distributor_id = '$ver'");
					$uq2_update = mysqli_query($con, "UPDATE `tbl_random_qr_generator` SET status = 'Verified',updated_at='$cdate11' WHERE token_id='$targetToken' and status='Pending'");
					$response['success']='1';
					$response['details']="QR-Code Verified Successfully";
				}
				
			}
		}
		else
		{
			$response['success']='0';
			$response['details']="QR-Code is Expired";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Invalid QR-Code";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>