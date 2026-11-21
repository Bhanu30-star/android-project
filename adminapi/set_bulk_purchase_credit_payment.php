<?php
include("../../connect.php");
$response = array();
if(isset($_POST['pmode']) && isset($_POST['tot_final_val']) && isset($_POST['distributor_id']))
{
	$cdate = $_POST['pay_date'];	
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$pmode=$_POST['pmode'];
	$pmtype = isset($_POST['pmtype']) ? $_POST['pmtype'] : '';
	$cheque_bank = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_number = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : $cdate;
	$cheq_bank_id=isset($_POST['bank_detail']) ? $_POST['bank_detail'] : '0';
	$pp_id1=$_POST['partydetail'];
	$actual_received_amt=$_POST['tot_final_val'];	
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$scri=date('H:i:sa');	
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
	$toder = $_POST['bulk_transcation'];
	
	$json_a=json_decode($toder, true);  
	foreach ($json_a as $person_a)
	{
		$txn_billno=$person_a['bill_no'];
		$txn_unique_bill=$person_a['unique_bill'];
		$tot_amt_val=$person_a['final_amt'];
		$actual_adjust_amt=$tot_amt_val;
		$select_product = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and party_id='$pp_id1' and bill_no='$txn_billno' and unique_bill='$txn_unique_bill'");
		while($fetch_pending_data=mysqli_fetch_assoc($select_product))
		{
			$update_txn_id=$fetch_pending_data['transaction_id'];
			$purchase_credit_amt=round($fetch_pending_data['final_net_amt']-$fetch_pending_data['pay_amount'],2);
			if($actual_adjust_amt>$purchase_credit_amt)
			{
				if($purchase_credit_amt>0)
				{
					$actual_adjust_amt11=round($purchase_credit_amt+$fetch_pending_data['pay_amount'],2);
					$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='$actual_adjust_amt11' where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$session_dist_ver' and transaction_id='$update_txn_id'");
					$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`cheque_no`,`bank_name`,`cheque_date`, `payment_type`,`status`,`party_id`,`bank_id`)values('$session_dist_ver','$cdate','$scri','$purchase_credit_amt','$pmode','$txn_unique_bill','$txn_billno','$cheque_no','$cheque_bank','$cheque_date','$pmtype','Complete','','$cheq_bank_id')");
					$actual_adjust_amt=$actual_adjust_amt-$purchase_credit_amt;
				}
			}
			else if($purchase_credit_amt>0)
			{
				$actual_adjust_amt11=round($actual_adjust_amt+$fetch_pending_data['pay_amount'],2);
				$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='$actual_adjust_amt11' where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$session_dist_ver' and transaction_id='$update_txn_id'");
				$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`cheque_no`,`bank_name`,`cheque_date`, `payment_type`,`status`,`party_id`,`bank_id`)values('$session_dist_ver','$cdate','$scri','$actual_adjust_amt','$pmode','$txn_unique_bill','$txn_billno','$cheque_no','$cheque_bank','$cheque_date','$pmtype','Complete','','$cheq_bank_id')");
				$actual_adjust_amt=0;
				break;
			}	
		}
	}	
	
	if($uq1)
	{
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->purchaseminuscollection($session_dist_ver,$actual_received_amt,$cdate,$pp_id1);

		if($dist_dsr_require=='Yes')
		{
			include("cash_bank_effect_class.php");
			if($pmode=='Cash')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasecashcollection($ver,$actual_received_amt,$cdate);
			}
			else if($pmode=='Online')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasebankcollection($ver,$cheq_bank_id,$actual_received_amt,$cdate);
			}
		}
		$response['success']='1';
		$response['details']="Payment Successfully Completed";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>