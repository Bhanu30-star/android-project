<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['bank_name']) && isset($_POST['distributor_id']) && isset($_POST['account_no']) && isset($_POST['ifsc_no']) && isset($_POST['account_name']) && isset($_POST['bank_type']) && isset($_POST['branchname']) && isset($_POST['master_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$bname=$_POST['bank_name'];
	$acno=$_POST['account_no'];
	$branchname=$_POST['branchname'];
	$ifscno=$_POST['ifsc_no'];
	$acname=$_POST['account_name'];
	$banktype=$_POST['bank_type'];
	$mstid=$_POST['master_id'];
	$amunt=$_POST['opening_amt'];
	$entryflag=$_POST['entryflag'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11=date("Y-m-d");
	$rs1=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and account_no='$acno' and bank_master_id!='$mstid'");
	if(mysqli_num_rows($rs1)==0)
	{
		if($banktype=='Primary')
		{
			$rs_history=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and bank_master_id='$mstid'");
			while($fetch_data=mysqli_fetch_assoc($rs_history))
			{
				$insert_history=mysqli_query($con,"INSERT INTO `tbl_distributor_bank_master_history`( `bank_master_id`, `distributor_id`, `bank_name`, `account_no`, `account_name`, `branch_name`, `ifsc_no`, `type`, `status`, `tb_insertdatetime`, `closing_amt`) VALUES ('$mstid','$session_dist_ver','".$fetch_data['bank_name']."','".$fetch_data['account_no']."','".$fetch_data['account_name']."','".$fetch_data['branch_name']."','".$fetch_data['ifsc_no']."','".$fetch_data['type']."','".$fetch_data['status']."','$cdate11','".$fetch_data['opening_balance']."')");
				
				$uq2=mysqli_query($con,"update tbl_distributor set ifsc_no='$ifscno',branch='$branchname',account_no='$acno',update_datetime='$cdate11',bank_name='$bname',account_name='$acname' where distributor_id='$session_dist_ver'");
				$uq21=mysqli_query($con,"update tbl_distributor_bank_master set type='Secondary' where distributor_id='$session_dist_ver' and bank_master_id!='$mstid'");
				$query=mysqli_query($con,"update tbl_distributor_bank_master set ifsc_no='$ifscno',branch_name='$branchname',account_no='$acno',update_datetime='$cdate11',bank_name='$bname',account_name='$acname',type='Primary' where distributor_id='$session_dist_ver' and bank_master_id='$mstid'");
				
				if($entryflag==0)
				{
					$query_1=mysqli_query($con,"update tbl_distributor_bank_master set opening_balance='$amunt' where distributor_id='$session_dist_ver' and bank_master_id='$mstid'");
					$querys = mysqli_query($con,"INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date,time) VALUES ('$session_dist_ver','$mstid','$amunt','$amunt','$update_date','$update_time')");
				}
				
				$response['success']='1';
				$response['message']="Bank Detail Successfully Updated";
			}
		}
		else
		{
			$rs_check=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and type='Primary' and bank_master_id!='$mstid'");
			if(mysqli_num_rows($rs_check)>0)
			{
				$rs_history=mysqli_query($con,"select * from tbl_distributor_bank_master where distributor_id='$session_dist_ver' and bank_master_id='$mstid'");
				while($fetch_data=mysqli_fetch_assoc($rs_history))
				{
					$insert_history=mysqli_query($con,"INSERT INTO `tbl_distributor_bank_master_history`( `bank_master_id`, `distributor_id`, `bank_name`, `account_no`, `account_name`, `branch_name`, `ifsc_no`, `type`, `status`, `tb_insertdatetime`) VALUES ('$mstid','$session_dist_ver','".$fetch_data['bank_name']."','".$fetch_data['account_no']."','".$fetch_data['account_name']."','".$fetch_data['branch_name']."','".$fetch_data['ifsc_no']."','".$fetch_data['type']."','".$fetch_data['status']."','$cdate11')");
					$query=mysqli_query($con,"update tbl_distributor_bank_master set ifse_no='$ifscno',branch_name='$branchname',account_no='$acno',update_datetime='$cdate11',bank_name='$bname',account_name='$acname',type='Secondary' where distributor_id='$session_dist_ver' and bank_master_id='$mstid'");
					if($entryflag==0)
					{
						$query_1=mysqli_query($con,"update tbl_distributor_bank_master set opening_balance='$amunt' where distributor_id='$session_dist_ver' and bank_master_id='$mstid'");
						$querys = mysqli_query($con,"INSERT INTO tbl_distributor_bank_collection(distributor_id, bank_id, opening_amt,closing_amt,date,time) VALUES ('$session_dist_ver','$mstid','$amunt','$amunt','$update_date','$update_time')");
					}
					$response['success']='1';
					$response['message']="Bank Detail Successfully Updated";
				}
			}
			else
			{
				$response['success']='0';
				$response['message']="Select Primary Account First and Then Update!";
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['message']="Bank Account No Already Exists!";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>