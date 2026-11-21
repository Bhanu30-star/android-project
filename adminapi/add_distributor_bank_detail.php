<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['bank_name']) && isset($_POST['distributor_id']) && isset($_POST['account_no']) && isset($_POST['ifsc_no']) && isset($_POST['account_name']) && isset($_POST['bank_type']) && isset($_POST['branchname']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$bname=$_POST['bank_name'];
	$acno=$_POST['account_no'];
	$branchname=$_POST['branchname'];
	$ifscno=$_POST['ifsc_no'];
	$acname=$_POST['account_name'];
	$openamount=$_POST['openamount'];
	$banktype=$_POST['bank_type'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d")." ".date("H:i:s");
	$rs1=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and account_no='$acno'");
	if(mysqli_num_rows($rs1)<=0)
	{
		if($banktype='Primary')
		{
			$uq2=mysqli_query($con,"update tbl_distributor set ifsc_no='$ifscno',branch='$branchname',account_no='$acno',update_datetime='$cdate11',bank_name='$bname',account_name='$acname' where distributor_id='$session_dist_ver'");
			$uq21=mysqli_query($con,"update tbl_distributor_bank_master set type='Secondary' where distributor_id='$session_dist_ver'");
			$query = mysqli_query($con,"INSERT INTO `tbl_distributor_bank_master`(`distributor_id`, `bank_name`, `account_no`, `account_name`, `branch_name`, `ifsc_no`, `type`, `status`, `tb_insertdatetime`,`opening_balance`) VALUES ('$session_dist_ver','$bname','$acno','$acname','$branchname','$ifscno','$banktype','Active','$cdate11','$openamount')");
			$bank_id = mysqli_insert_id($con);
		}
		else
		{
			$query = mysqli_query($con,"INSERT INTO `tbl_distributor_bank_master`(`distributor_id`, `bank_name`, `account_no`, `account_name`, `branch_name`, `ifsc_no`, `type`, `status`, `tb_insertdatetime`,`opening_balance`) VALUES ('$session_dist_ver','$bname','$acno','$acname','$branchname','$ifscno','$banktype','Active','$cdate11','$openamount')");
			$bank_id = mysqli_insert_id($con);
		}
		
		$querys = mysqli_query($con,"INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date,time) VALUES ('$session_dist_ver','$bank_id','$openamount','$openamount','$update_date','$update_time')");
		$response['success']='1';
		$response['message']="Bank Detail Successfully Inserted";
	}
	else
	{
		$response['success']='0';
		$response['message']="Bank Detail Already Exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>