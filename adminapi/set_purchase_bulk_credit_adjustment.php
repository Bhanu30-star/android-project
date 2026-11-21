<?php
include("../../connect.php");
$response = array();
if(isset($_POST['pmode']) && isset($_POST['tot_amt_val']) && isset($_POST['distributor_id']))
{					
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$pmode=$_POST['pmode'];
	$cdate = isset($_POST['pay_date']) ? $_POST['pay_date'] : $c_date;
	$pmtype = isset($_POST['pmtype']) ? $_POST['pmtype'] : '';
	$cheque_bank = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_number = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : $c_date;
	$cheq_bank_id=isset($_POST['bank_detail']) ? $_POST['bank_detail'] : '0';
	$pp_id1=$_POST['partydetail'];
	$tot_amt_val=$actual_received_amt=$_POST['tot_amt_val'];	
	$actual_adjust_amt=$tot_amt_val;
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scri  = date("Y-m-d")." ".date('H:i:sa');
	$c_date=date("Y-m-d");
	$scro=date('H:i:sa');	
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
	
	$select_product = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and txn_type='Add' and payment_mode='Credit' and party_id='$pp_id1' and payment_status='Pending'");
	while($fetch_pending_data=mysqli_fetch_assoc($select_product))
	{
		$update_txn_id=$fetch_pending_data['transaction_id'];
		$purchase_credit_amt=round($fetch_pending_data['final_net_amt']-$fetch_pending_data['pay_amount'],2);
		if($actual_adjust_amt>$purchase_credit_amt)
		{
			if($purchase_credit_amt>0)
			{
				$actual_adjust_amt11=round($purchase_credit_amt+$fetch_pending_data['pay_amount'],2);
				$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_adjust_amt11' where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$session_dist_ver' and transaction_id='$update_txn_id'");
				$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`cheque_no`, `bank_name`, `cheque_date`, `payment_type`,`status`,`party_id`,`bank_id`)values('$session_dist_ver','$cdate','$scro','$purchase_credit_amt','$pmode','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['bill_no']."','$cheque_no','$cheque_bank','$cheque_date','$pmtype','Complete','','$cheq_bank_id')");
				$actual_adjust_amt=$actual_adjust_amt-$purchase_credit_amt;
			}
		}
		else if($purchase_credit_amt>0)
		{
			$actual_adjust_amt11=round($actual_adjust_amt+$fetch_pending_data['pay_amount'],2);
			$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_adjust_amt11' where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$session_dist_ver' and transaction_id='$update_txn_id'");
			$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`cheque_no`, `bank_name`, `cheque_date`, `payment_type`,`status`,`party_id`,`bank_id`)values('$session_dist_ver','$cdate','$scro','$actual_adjust_amt','$pmode','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['bill_no']."','$cheque_no','$cheque_bank','$cheque_date','$pmtype','Complete','','$cheq_bank_id')");
			$actual_adjust_amt=0;
			break;
		}	
	}	
	
	if($uq1)
	{
		if($actual_adjust_amt<=0)
		{
			$adjusted_final_amt=$actual_received_amt;
		}
		else
		{
			$adjusted_final_amt=$actual_received_amt-$actual_adjust_amt;
		}
		
		include("sale-purchase-balance-effect-class.php");
		$CashCollection=new Collectionbalance();
		$collections=$CashCollection->purchaseminuscollection($session_dist_ver,$adjusted_final_amt,$cdate,$pp_id1);

		if($dist_dsr_require=='Yes')
		{
			include("cash_bank_effect_class.php");
			if($pmode=='Cash')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasecashcollection($session_dist_ver,$tot_amt_val,$cdate);
			}
			else if($pmode=='Online')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasebankcollection($session_dist_ver,$cheq_bank_id,$tot_amt_val,$cdate);
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