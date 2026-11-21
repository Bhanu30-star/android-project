<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cash_txn_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$cash_txn_id=$_POST['cash_txn_id'];
	$expens=mysqli_query($con,"SELECT * FROM `tbl_other_cash_txn_master` WHERE `transaction_id`='$cash_txn_id' AND `distributor_id`='$session_dist_ver' AND status='Complete'");
	while($fetch_expens=mysqli_fetch_assoc($expens))
	{
		$ins_date=$fetch_expens['insert_date'];
		$updt=mysqli_query($con,"UPDATE `tbl_other_cash_txn_master` SET `status`='Delete' WHERE `transaction_id`='$cash_txn_id' AND `distributor_id`='$session_dist_ver' AND `status`='Complete' AND `insert_date`='$ins_date'");
		if($updt)
		{
			include("cash_bank_effect_class.php");
			if ($fetch_expens['txn_type'] == 'To Receive') {
				$CashCollection=new Collection();
				$collections=$CashCollection->cashcollection($session_dist_ver,$fetch_expens['txn_amount'],$ins_date);
			} 
			else
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasecashcollection($session_dist_ver,$fetch_expens['txn_amount'],$ins_date);
			}
			$response['success']='1';
			$response['details']="Transaction Successfully Cancelled";								
		}
		else
		{
			$response['success']='0';
			$response['details']="Transaction Not Cancelled";		
		}
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>