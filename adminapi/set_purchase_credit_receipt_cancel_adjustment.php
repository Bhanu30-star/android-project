<?php
include("../../connect.php");
$response = array();
if(isset($_POST['payment_id']) && isset($_POST['distributor_id']))
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
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$sid_id=$_POST['payment_id'];
	$res_payment = mysqli_query($con,"SELECT * FROM tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and payment_id='$sid_id'");
	if(mysqli_num_rows($res_payment)>0)
	{ 
		while($fetch_data=mysqli_fetch_assoc($res_payment))
		{
			$bill_uid=$fetch_data['unique_bill'];
			$bill_no_id=$fetch_data['bill_no'];
			$actual_add_paid_pay=$final_amt=$fetch_data['total_amount'];
			$txn_receipt=$fetch_data['adjust_by_receipt_bill_no'];
			$txn_uniqueid=$fetch_data['adjust_by_unique_bill'];
			$query = mysqli_query($con,"INSERT INTO `tbl_purchase_payment_transaction_cancel`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `cheque_no`, `bank_name`, `cheque_date`, `payment_type`, `status`, `remark`,`insert_date`,`party_id`,`bank_id`,`receive_disc_amt`) VALUES ('$session_dist_ver','".$fetch_data['payment_date']."','".$fetch_data['payment_time']."','".$fetch_data['total_amount']."','".$fetch_data['payment_mode']."','".$fetch_data['unique_bill']."','".$fetch_data['bill_no']."','".$fetch_data['cheque_no']."','".$fetch_data['bank_name']."','".$fetch_data['cheque_date']."','".$fetch_data['payment_type']."','".$fetch_data['status']."','".$fetch_data['remark']."','$cdate','".$fetch_data['party_id']."','".$fetch_data['bank_id']."','".$fetch_data['receive_disc_amt']."')");
			
			if($fetch_data['party_id']>0)
			{
				$actual_add_paid_pay=$fetch_data['total_amount']+$fetch_data['receive_disc_amt'];
				$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt=round(adjusted_outstanding_amt-'$actual_add_paid_pay',2) where distributor_id='$session_dist_ver' and purchase_party_id='".$fetch_data['party_id']."'");
			}
			else
			{
				$res_update = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$session_dist_ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id'");
				while($fetch_product=mysqli_fetch_assoc($res_update))
				{
					$update_txn_id=$fetch_product['transaction_id'];
					if($fetch_product['pay_amount']>=$actual_add_paid_pay && $actual_add_paid_pay>0)
					{
						$actual_add_paid=$fetch_product['pay_amount']-$fetch_data['total_amount'];
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='$actual_add_paid',payment_status='Pending' where payment_mode='Credit' and distributor_id='$session_dist_ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id' and transaction_id='$update_txn_id'");
						$actual_add_paid_pay=0;
						break;
					}
					else if($actual_add_paid_pay>0)
					{
						$actual_add_paid_pay=$actual_add_paid_pay-$fetch_product['pay_amount'];
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$da',pay_amount='0', payment_status='Pending' where payment_mode='Credit' and distributor_id='$session_dist_ver' and  unique_bill='$bill_uid' and bill_no='$bill_no_id' and transaction_id='$update_txn_id'");
					}
				}
			}
			if($query)
			{
				if($fetch_data['payment_mode']=='Adjustment' && $fetch_data['remark']=='Advance Amt')
				{
					$res_update_debitnote = mysqli_query($con,"update tbl_purchase_advance_txn_detail set adjust_amount=round(adjust_amount-'$final_amt', 2), adjustment_status='Pending' where distributor_id='$session_dist_ver' and receipt_txn_id='$txn_receipt'");
				}
				else if($fetch_data['payment_mode']=='Adjustment' && $fetch_data['remark']=='Direct Debit Note')
				{
					$adjust_payment_amount=$final_amt;
					$res1 = mysqli_query($con,"select * from tbl_party_debit_note where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_uniqueid'");
					while($fetch_product1=mysqli_fetch_assoc($res1))
					{
						if($fetch_product1['debit_note_type']=='Direct')
						{
							$res_update_debitnote = mysqli_query($con,"update tbl_party_debit_note set adjust_amount=round(adjust_amount-'$final_amt', 2), debit_note_status='Pending' where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_uniqueid'");
						}
						else
						{
							$d_txn_id=$fetch_product1['debitnote_id'];
							if($fetch_product1['adjust_amount']<=$adjust_payment_amount && $adjust_payment_amount>0)
							{
								$adjust_payment_amount=$adjust_payment_amount-$fetch_product1['adjust_amount'];
								$res_update_debitnote = mysqli_query($con,"update tbl_party_debit_note set adjust_amount='0',debit_note_status= 'Pending' where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_uniqueid' and debitnote_id='$d_txn_id'");
							}
							else if($fetch_product1['adjust_amount']>$adjust_payment_amount && $adjust_payment_amount>0)
							{
								$res_update_debitnote = mysqli_query($con,"update tbl_party_debit_note set adjust_amount=round(adjust_amount-'$adjust_payment_amount', 2), debit_note_status='Pending' where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_uniqueid' and debitnote_id='$d_txn_id'");
								$adjust_payment_amount=0;
							}
						}
					}
				}
				else if($fetch_data['payment_mode']=='Adjustment' && $fetch_data['remark']=='Purchase Return')
				{
					$adjust_payment_amount=$final_amt;
					$res1 = mysqli_query($con,"select * from tbl_purchase_return_transaction where distributor_id='$session_dist_ver' and debit_note_receipt='$txn_receipt' and unique_bill='$txn_uniqueid'");
					while($fetch_product1=mysqli_fetch_assoc($res1))
					{
						$d_txn_id=$fetch_product1['history_id'];
						if($fetch_product1['adjust_amount']<=$adjust_payment_amount && $adjust_payment_amount>0)
						{
							$adjust_payment_amount=$adjust_payment_amount-$fetch_product1['adjust_amount'];
							$res_update_debitnote = mysqli_query($con,"update tbl_purchase_return_transaction set adjust_amount='0', debit_note_status= 'Pending' where distributor_id='$session_dist_ver' and debit_note_receipt='$txn_receipt' and unique_bill='$txn_uniqueid' and history_id='$d_txn_id'");
						}
						else if($fetch_product1['adjust_amount']>$adjust_payment_amount && $adjust_payment_amount>0)
						{
							$res_update_debitnote = mysqli_query($con,"update tbl_purchase_return_transaction set adjust_amount = round(adjust_amount-'$adjust_payment_amount', 2), debit_note_status='Pending' where distributor_id='$session_dist_ver' and debit_note_receipt='$txn_receipt' and unique_bill='$txn_uniqueid' and history_id='$d_txn_id'");
							$adjust_payment_amount=0;
						}
					}
				}
				
				$res_update = mysqli_query($con,"delete FROM tbl_purchase_payment_transaction where distributor_id='$session_dist_ver' and unique_bill='$bill_uid' and bill_no='$bill_no_id' and payment_id='$sid_id'");
				
				$response['success']='1';
				$response['details']="Receipt Successfully Cancelled";
			}
			else
			{
				$response['success']='0';
				$response['details']="Bill Not Cancelled";
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Txn Not Exists.Please check and try again later!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>