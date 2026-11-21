<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['txn_id']) && isset($_POST['distributor_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$get_txn_id=$_POST['txn_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate=date("Y-m-d");
	$deposit=mysqli_query($con,"SELECT * FROM `tbl_distributor_bank_transfer` WHERE `txn_id`='$get_txn_id' AND `distributor_id`='$session_dist_ver' AND status='Complete'");
	$fetch_deposit=mysqli_fetch_assoc($deposit);
	$ins_date=$fetch_deposit['insert_date'];
	
	$updt=mysqli_query($con,"UPDATE `tbl_distributor_bank_transfer` SET `status`='Cancelled' WHERE `txn_id`='$get_txn_id' AND `distributor_id`='$session_dist_ver' AND `status`='Complete' AND `insert_date`='$ins_date'");
	if($updt)
	{
		include("cash_bank_effect_class.php");
		if($fetch_deposit['txn_type']=="Cheque Withdrawal")
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->bankcollection($session_dist_ver,$fetch_deposit['bank_id'],$fetch_deposit['withdrawal_amt'],$ins_date);
		} else if($fetch_deposit['txn_type']=="Cheque Deposite")
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->purchasebankcollection($session_dist_ver,$fetch_deposit['bank_id'],$fetch_deposit['transfer_amt'],$ins_date);
		} else if($fetch_deposit['txn_type']=="Deposite")
		{
			$CashCollection=new Collection();
			if($fetch_deposit['bank_contra_id']>0){
				// Update Cash Collection Table
				// Update Cash Collection Table
				$CashCollection=new Collection();
				$collections=$CashCollection->bankcollection($session_dist_ver,$fetch_deposit['bank_contra_id'],$fetch_deposit['transfer_amt'],$ins_date);
				$collections=$CashCollection->purchasebankcollection($session_dist_ver,$fetch_deposit['bank_id'],$fetch_deposit['transfer_amt'],$ins_date);
				// Update Cash Collection Table
				// Update Cash Collection Table
			} else {
				// Update Cash Collection Table
				// Update Cash Collection Table
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasebankcollection($session_dist_ver,$fetch_deposit['bank_id'],$fetch_deposit['transfer_amt'],$ins_date);
				$collections=$CashCollection->cashcollection($session_dist_ver,$fetch_deposit['transfer_amt'],$ins_date);
				// Update Cash Collection Table
				// Update Cash Collection Table
			}
		} else if($fetch_deposit['txn_type']=="Withdrawal")
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->bankcollection($session_dist_ver,$fetch_deposit['bank_id'],$fetch_deposit['withdrawal_amt'],$ins_date);
			$collections=$CashCollection->purchasecashcollection($session_dist_ver,$fetch_deposit['withdrawal_amt'],$ins_date);
		}
		else if($fetch_deposit['txn_type']=="Cheque Bounce" || $fetch_deposit['txn_type']=="Other Tax Paid")
		{
			$CashCollection=new Collection();
			$collections=$CashCollection->bankcollection($session_dist_ver,$fetch_deposit['bank_id'],$fetch_deposit['withdrawal_amt'],$ins_date);
		}
		$response['success']='1';
		$response['message']="Bank Deposit Successfully cancelled";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>