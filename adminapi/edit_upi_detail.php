<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['upi_id']) && isset($_POST['upi_detail']))
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
	$update_date=date("Y-m-d");
	$mstid=$_POST['upi_id'];
	$bname = $_POST['upi_detail'];
	$banktype=$_POST['upitype'];
	$rs1=mysqli_query($con,"select * from tbl_distributor_upi_master where distributor_id='$session_dist_ver' and upi_detail='$bname' and upi_id!='$mstid'");
	if(mysqli_num_rows($rs1)<=0)
	{
		$rs_history=mysqli_query($con,"select * from tbl_distributor_upi_master where distributor_id='$session_dist_ver' and upi_id='$mstid'");
		while($fetch_data=mysqli_fetch_assoc($rs_history))
		{
			$insert_history=mysqli_query($con,"INSERT INTO `tbl_distributor_upi_master_history`(`upi_id`, `distributor_id`, `upi_detail`, `insert_date`,`type`) VALUES ('$mstid','$session_dist_ver','".$fetch_data['upi_detail']."','$update_date','".$fetch_data['type']."')");
			if($banktype=='Primary')
			{
				$uq21=mysqli_query($con,"update tbl_distributor_upi_master set type='Secondary' where distributor_id='$session_dist_ver' and upi_id!='$mstid'");
				$query=mysqli_query($con,"update tbl_distributor_upi_master set upi_detail='$bname',type='Primary' where distributor_id='$session_dist_ver' and upi_id='$mstid'");
				// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver','UPDATE OPERATION,Edit UPI#Admin(UPDATE)tbl_distributor_upi_master', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
				$response['success']='1';
				$response['details']="UPI Detail Successfully Updated";	
			}
			else
			{
				$rs_check=mysqli_query($con,"select * from tbl_distributor_upi_master where distributor_id='$session_dist_ver' and type='Primary' and upi_id!='$mstid'");
				if(mysqli_num_rows($rs_check)>0)
				{
					$query=mysqli_query($con,"update tbl_distributor_upi_master set upi_detail='$bname',type='Secondary' where distributor_id='$session_dist_ver' and upi_id='$mstid'");
					// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$session_dist_ver','UPDATE OPERATION,Edit UPI#Admin(UPDATE)tbl_distributor_upi_master',current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
					$response['success']='1';
					$response['details']="UPI Detail Successfully Updated";	
				}
				else
				{
					$response['success']='0';
					$response['details']="Select Primary Account First and Then Update!";	
				}
			}
		}
	}
	else
	{
		 $response['success']='0';
		 $response['details']="UPI Detail Already Exists";	
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>