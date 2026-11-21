<?php
include("../../connect.php");
$response = array();
if(isset($_POST['rec_id']) && isset($_POST['distributor_id']))
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
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$get_txn_id1=$_POST['rec_id'];
	$cash_amt=0;
	$cashmaster_affect='';
	$res = mysqli_query($con,"select * from tbl_receipt_transaction where receipt_id='$get_txn_id1'");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$cash_amt=$cash_amount;
		$final_txn_id=$transaction_id;
		$pmode=$fetch_product['payment_mode'];
		$txn_receipt=$fetch_product['txn_receipt_id'];
		$txn_remark=$fetch_product['remark'];
		$final_amount=$fetch_product['total_amount']+$fetch_product['receipt_disc_amt'];
		$stock_insert=mysqli_query($con,"INSERT IGNORE INTO tbl_receipt_cancel_history(receipt_id,txn_receipt_id,transaction_id, receipt_date,receipt_time,total_amount,payment_mode,cash_amount,cheque_amount,cheque_no,bank_name,cheque_date,cash_receipt,status,remark,cancel_datetime,action_by,bank_id,receipt_disc_amt,`generated_user_id`)values('$receipt_id','$txn_receipt_id','$transaction_id','$receipt_date','$receipt_time','$total_amount','$payment_mode','$cash_amount','$cheque_amount','$cheque_no','$bank_name','$cheque_date','$cash_receipt','$status','$remark','$scri','$session_dist_ver','$deposit_bank_id','$receipt_disc_amt','$generated_user_id')");
	}
	if($stock_insert)
	{
		if($fetch_product['party_id']>0)
		{
			$uq21=mysqli_query($con,"UPDATE tbl_party SET adjusted_outstanding_amt=round(adjusted_outstanding_amt-'$final_amount',2) where distributor_id='$session_dist_ver' and party_id='".$fetch_product['party_id']."'");
		}
		else
		{
			$res_party = mysqli_query($con,"select cash_amount,transaction_to from tbl_party_transaction where transaction_id='$final_txn_id'");
			while($party_txn_detail=mysqli_fetch_assoc($res_party))
			{
				$final_cash_amt=$party_txn_detail['cash_amount'];
				$pp_id1=$party_txn_detail['transaction_to'];
				$set_amount=$final_cash_amt-$final_amount;
				if($set_amount==0)
				{
					$set_pstatus='Pending';
					$set_receipt_date="0000-00-00";
				}
				else
				{
					$set_pstatus='Partial Completed';
					$res_receipt = mysqli_query($con,"select receipt_date from tbl_receipt_transaction where transaction_id='$final_txn_id' order by receipt_id desc limit 1,2");
					while($receipt_txn_detail=mysqli_fetch_assoc($res_receipt))
					{
						$set_receipt_date=$receipt_txn_detail['receipt_date'];
					}
				}
				$uq21=mysqli_query($con,"update tbl_party_transaction set cash_amount='$set_amount',payment_status='$set_pstatus',cash_receipt_date='$set_receipt_date' where transaction_id='$final_txn_id'"); 
			}
		}
		if($uq21)
		{
			if($pmode=='Adjust Credit Note')
			{
				$adjust_payment_amount=$final_amount;
				$res1 = mysqli_query($con,"select * from tbl_party_credit_note where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_remark'");
				while($fetch_product1=mysqli_fetch_assoc($res1))
				{
					if($fetch_product1['credit_note_type']=='Direct')
					{
						$uq_update=mysqli_query($con,"update tbl_party_credit_note set adjust_amount=round(adjust_amount-'$final_amount',2), credit_note_status='Pending' where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_remark'"); 
					}
					else
					{
						$d_txn_id=$fetch_product1['creditnote_id'];
						if($fetch_product1['adjust_amount']<=$adjust_payment_amount && $adjust_payment_amount>0)
						{
							$adjust_payment_amount=$adjust_payment_amount-$fetch_product1['adjust_amount'];
							$res_update_debitnote = mysqli_query($con,"update tbl_party_credit_note set adjust_amount='0', credit_note_status= 'Pending' where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_remark' and creditnote_id='$d_txn_id'");
						}
						else if($fetch_product1['adjust_amount']>$adjust_payment_amount && $adjust_payment_amount>0)
						{
							$res_update_debitnote = mysqli_query($con,"update tbl_party_credit_note set adjust_amount = round(adjust_amount-'$adjust_payment_amount', 2), credit_note_status='Pending' where distributor_id='$session_dist_ver' and bill_no='$txn_receipt' and unique_bill='$txn_remark' and creditnote_id='$d_txn_id'");
							$adjust_payment_amount=0;
						}
					}
				}
			}
			else if($pmode=='Adjust Advance Payment')
			{
				$uq_update=mysqli_query($con,"update tbl_other_receipt_txn set adjust_amount=round(adjust_amount-'$final_amount',2), adjustment_status='Pending' where user_receipt_id='$txn_receipt' and receipt_txn_id='$txn_remark'");
			}
			$resd1 = mysqli_query($con,"DELETE FROM tbl_receipt_transaction where receipt_id='$get_txn_id1'");
		}
	}
	if($resd1)
	{
		$response['success']='1';
		$response['details']="Receipt Successfully Cancelled";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>