<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['party_id']) && isset($_POST['receipt_txnid']))
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
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$receipt_txnid = $_POST['receipt_txnid'];
	$pp_id1 = $_POST['party_id'];
	$adjusted_type = isset($_POST['adjusted_typenote']) ? $_POST['adjusted_typenote'] : 'Auto';

	$res_credit_note = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail where party_id='$pp_id1' and adjustment_status='Pending' and receipt_txn_id='$receipt_txnid' and status='Complete'");
	while($fetch_creditnote_data=mysqli_fetch_assoc($res_credit_note))
	{								
		$actual_adjust_amt_final=$fetch_creditnote_data['total_amount']-$fetch_creditnote_data['adjust_amount'];
		$actual_adjust_amt=$actual_adjust_amt_final;
		if($adjusted_type=="Auto")
		{
			$res_calculate_1=mysqli_query($con,"SELECT * FROM tbl_purchase_party where purchase_party_id='$pp_id1' and outstanding_amount>0 and outstanding_amount!=adjusted_outstanding_amt");	
			if(mysqli_num_rows($res_calculate_1)>0)
			{
				while($fetch_product_2=mysqli_fetch_assoc($res_calculate_1))
				{
					$credit_amt=round($fetch_product_2['outstanding_amount']-$fetch_product_2['adjusted_outstanding_amt'],2);
					if($actual_adjust_amt>$credit_amt)
					{
						if($credit_amt>0)
						{
							$actual_adjust_amt11=round($credit_amt+$fetch_product_2['adjusted_outstanding_amt'],2);
							$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt='$actual_adjust_amt11' where purchase_party_id='$pp_id1' and distributor_id='$session_dist_ver'");
							$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`remark`,`status`, `adjust_by_receipt_bill_no`, `adjust_by_unique_bill`,`party_id`)values('$session_dist_ver','$cdate','$scri','$credit_amt','Adjustment','','','Advance Amt','Complete','$receipt_txnid','','$pp_id1')");
							$actual_adjust_amt=$actual_adjust_amt-$credit_amt;
						}
					} 
					else if($credit_amt>0) 
					{
						$actual_adjust_amt11=round($actual_adjust_amt+$fetch_product_2['adjusted_outstanding_amt'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt='$actual_adjust_amt11' where purchase_party_id='$pp_id1' and distributor_id='$session_dist_ver'");
						$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`remark`,`status`, `adjust_by_receipt_bill_no`, `adjust_by_unique_bill`,`party_id`)values('$session_dist_ver','$cdate','$scri','$actual_adjust_amt','Adjustment','','','Advance Amt','Complete','$receipt_txnid','','$pp_id1')");
						$actual_adjust_amt=0;
						break;
					}
				}
			}
		}
		if($actual_adjust_amt>0)
		{		
			if($adjusted_type=="Auto")
			{
				$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and txn_type='Add' and payment_mode='Credit' and party_id='$pp_id1' and payment_status='Pending'");
			}
			else
			{
				$adjust_manual_billno=explode('#$&',$_POST['manual_billno']);
				$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and txn_type='Add' and payment_mode='Credit' and party_id='$pp_id1' and payment_status='Pending' and bill_no='$adjust_manual_billno[0]' and unique_bill='$adjust_manual_billno[1]'");
			}
			while($fetch_pending_data=mysqli_fetch_assoc($res_purchase_adjust))
			{
				$update_txn_id=$fetch_pending_data['transaction_id'];
				$purchase_credit_amt=round($fetch_pending_data['final_net_amt']-$fetch_pending_data['pay_amount'],2);
				if($actual_adjust_amt>$purchase_credit_amt)
				{
					if($purchase_credit_amt>0)
					{
						$actual_adjust_amt11=round($purchase_credit_amt+$fetch_pending_data['pay_amount'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_adjust_amt11',payment_txn_id='$receipt_txnid' where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$session_dist_ver' and transaction_id='$update_txn_id'");

						$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `remark`,`status`, `adjust_by_receipt_bill_no` )values('$session_dist_ver','$cdate','$scri','$purchase_credit_amt','Adjustment','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['bill_no']."','Advance Amt','Complete','$receipt_txnid')");
						$actual_adjust_amt=$actual_adjust_amt-$purchase_credit_amt;
					}
				}
				else if($purchase_credit_amt>0)
				{
					$actual_adjust_amt11=round($actual_adjust_amt+$fetch_pending_data['pay_amount'],2);
					$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_adjust_amt11',payment_txn_id='$receipt_txnid'  where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$session_dist_ver' and transaction_id='$update_txn_id'");
					$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`,`payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `remark`,`status`, `adjust_by_receipt_bill_no`) values('$session_dist_ver','$cdate','$scri','$actual_adjust_amt','Adjustment','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['bill_no']."','Advance Amt','Complete','$receipt_txnid')");
					$actual_adjust_amt=0;
					break;
				}
			}
		}
		$actual_adjust_amt_credit=$actual_adjust_amt_final-$actual_adjust_amt;
		if($actual_adjust_amt_credit>0)
		{
			$res_debit_adjust = mysqli_query($con,"SELECT * FROM tbl_purchase_advance_txn_detail where party_id='$pp_id1' and adjustment_status='Pending' and receipt_txn_id='$receipt_txnid' and status='Complete'");
			while($fetch_pending_data11=mysqli_fetch_assoc($res_debit_adjust))
			{
				$purchase_credit_amt=$fetch_pending_data11['total_amount']-$fetch_pending_data11['adjust_amount'];
				if($purchase_credit_amt==0)
					$uq1=mysqli_query($con,"UPDATE tbl_purchase_advance_txn_detail SET adjustment_status='Complete' where party_id='$pp_id1' and receipt_txn_id='$receipt_txnid'");
				if($actual_adjust_amt_credit>$purchase_credit_amt)
				{
					if($purchase_credit_amt>0)
					{
						$actual_adjust_amt11=round($purchase_credit_amt+$fetch_pending_data11['adjust_amount'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_purchase_advance_txn_detail SET update_bill_datetime='$da',adjust_amount='$actual_adjust_amt11',adjustment_status='Complete' where party_id='$pp_id1' and receipt_txn_id='$receipt_txnid'");
						$actual_adjust_amt_credit=$actual_adjust_amt_credit-$purchase_credit_amt;
					}
				}
				else if($purchase_credit_amt>0)
				{
					$actual_adjust_amt11=round($actual_adjust_amt_credit+$fetch_pending_data11['adjust_amount'],2);
					$uq1=mysqli_query($con,"UPDATE tbl_purchase_advance_txn_detail SET update_bill_datetime='$da',adjust_amount='$actual_adjust_amt11' where party_id='$pp_id1' and receipt_txn_id='$receipt_txnid'");
					$actual_adjust_amt_credit=0;
					break;
				}
			}
		}
	}
	$response['success']='1';
	$response['details']="Adjust Txn Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>