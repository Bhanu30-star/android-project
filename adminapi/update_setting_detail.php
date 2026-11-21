<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['dsrsalereq']) && isset($_POST['dsrreq']) && isset($_POST['distributor_id']) && isset($_POST['dsrdays']) && isset($_POST['dsr_requirement']))
{
	$ver = $_POST['distributor_id'];
	$dsrreq=$_POST['dsrreq'];
	$dsrsalereq=$_POST['dsrsalereq'];
	$udsrdays=$_POST['dsrdays'];
	$low_stock_alert=$_POST['low_stock_alert'];
	$udsr_requirement=$_POST['dsr_requirement'];
	if($udsrdays<=0 || $udsrdays>7)
	{
		$udsrdays=1;
		$msg="DSR days not allowed less than 1 or greater than 7.";
	}
	else
	{
		$msg="Update Detail Successful";
	}
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d")." ".date("H:i:s");
	$update_date=date("Y-m-d");
	$previous_date=date('Y-m-d', strtotime(' -1 day'));
	$update_time=date("H:i:s");
	$rs1=mysqli_query($con,"select * from tbl_distributor where distributor_id='$ver'");
	while($fetch_dis_check=mysqli_fetch_assoc($rs1))
	{
		$pname1=$fetch_dis_check['distributor_name'];
		$distri_email1=$fetch_dis_check['distributor_email'];
		$dist_pending_days=$fetch_dis_check['dsr_pending_days'];
		$dis_phone=$fetch_dis_check['phone_no'];
		$dis_stock_request_allowed=$fetch_dis_check['stock_request_allowed'];
		$dis_sale_allowed=$fetch_dis_check['sale_allowed'];
		$dis_dsr_requirement=$fetch_dis_check['dsr_requirement'];
		$dsr_require_date=$fetch_dis_check['dsr_require_date'];	
		$credit_sale_allowed=$fetch_dis_check['credit_sale_allowed'];	
		$query = mysqli_query($con,"INSERT INTO `tbl_distributor_history`(`distributor_id`, `dsr_pending_days`, `distributor_name`, `distributor_email`, `phone_no`, `stock_request_allowed`, `sale_allowed`,`insert_datetime_val`,`type_description`,`dsr_requirement`,`dsr_require_date`,`credit_sale_allowed`) VALUES ('$ver','$dist_pending_days','$pname1','$distri_email1','$dis_phone','$dis_stock_request_allowed','$dis_sale_allowed','$cdate11','Business Setting Changed','$dis_dsr_requirement','$dsr_require_date','$credit_sale_allowed')");
		
		if($udsr_requirement=="Yes" && $dis_dsr_requirement=="No")
		{
			$select_fos=mysqli_query($con,"select * from tbl_user where distributor_id='$ver'");
			while($fetch_fos_detail=mysqli_fetch_assoc($select_fos))
			{
				$fos_id=$fetch_fos_detail['user_id'];
				$check_dsr_fos=mysqli_query($con,"select * from tbl_dsr where user_id='$fos_id' and date='$previous_date'");
				if(mysqli_num_rows($check_dsr_fos)<=0)
				{
					$dsr_query = mysqli_query($con,"INSERT INTO tbl_dsr(`user_id`, `cash_detail`, `cheque_detail`, `total_amount`, `date`, `time`, `tb_insertdatetime`, `type`,`dsr_status`,`accept_reject_datetime`, `update_by`) VALUES ('$fos_id','0','0','0','$previous_date','$update_time','$cdate11','','Accept','$cdate11','$ver')");
				}
			}
		}
												
	}
	
	$uq2=mysqli_query($con,"update tbl_distributor set dsr_pending_days='$udsrdays',stock_request_allowed='$dsrreq',credit_sale_allowed='$dsrsalereq',dsr_requirement='$udsr_requirement',dsr_require_date='$update_date' where distributor_id='$ver'"); 
	$response['success']='1';
	$response['message']=$msg;
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>