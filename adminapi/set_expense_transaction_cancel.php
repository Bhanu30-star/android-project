<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['txn_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$get_expns_id=$_POST['txn_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$expens=mysqli_query($con,"SELECT * FROM `tbl_distributor_expenses_master` WHERE `expense_master_id`='$get_expns_id' AND `distributor_id`='$session_dist_ver' AND status='Complete'");
	$fetch_expens=mysqli_fetch_assoc($expens);
	$ins_date=$fetch_expens['insert_date'];
	if($ins_date==$cdate)
	{
		$updt=mysqli_query($con,"UPDATE `tbl_distributor_expenses_master` SET `status`='Cancelled' WHERE `expense_master_id`='$get_expns_id' AND `distributor_id`='$session_dist_ver' AND `status`='Complete' AND `insert_date`='$cdate'");
		if($updt)
		{
			include("cash_bank_effect_class.php");
			if ($fetch_expens['payment_mode'] == 'Cash') {
				$CashCollection=new Collection();
				$collections=$CashCollection->cashcollection($session_dist_ver,$fetch_expens['cash_amt'],$ins_date);
			} 
			else if ($fetch_expens['payment_mode'] == 'Bank')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->bankcollection($session_dist_ver,$fetch_expens['bank_id'],$fetch_expens['bank_amt'],$ins_date);
			}
			$response['success']='1';
			$response['message']="Expense Transaction Successfully cancelled";
		}
	}	
	else
	{
		$response['success']='0';
		$response['message']="Expense Transaction Not cancelled";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>