<?php
include("../../connect.php");
$response = array();
if(isset($_POST['uniqueId1']) && isset($_POST['billno1']) && isset($_POST['distributor_id']))
{
	$billno1=$_POST['billno1'];
	$uniqueId1=$_POST['uniqueId1'];
	$ver = $_POST['distributor_id'];
	$adjusted_type = isset($_POST['adjusted_typenote']) ? $_POST['adjusted_typenote'] : 'Auto';
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$res_credit_note = mysqli_query($con,"select *,sum(final_net_amt) as final_bill_amt,sum(adjust_amount) as final_adjust_amt from tbl_party_credit_note where distributor_id='$ver' and credit_note_status='Pending' and bill_no='$billno1' and unique_bill='$uniqueId1' group by bill_no,unique_bill");
	while($fetch_creditnote_data=mysqli_fetch_assoc($res_credit_note))
	{																		
		$actual_adjust_amt_final=$fetch_creditnote_data['final_bill_amt']-$fetch_creditnote_data['final_adjust_amt'];
		$actual_adjust_amt=$actual_adjust_amt_final;
		$pp_id1=$fetch_creditnote_data['party_id'];
		if($adjusted_type=="Auto")
		{
			$res_calculate_1=mysqli_query($con,"SELECT * FROM tbl_party where party_id='$pp_id1' and outstanding_amount>0 and outstanding_amount!=adjusted_outstanding_amt");	
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
							$uq1=mysqli_query($con,"UPDATE tbl_party SET adjusted_outstanding_amt='$actual_adjust_amt11' where party_id='$pp_id1' and distributor_id='$ver'");
							$insert_receipt = mysqli_query($con,"INSERT IGNORE INTO `tbl_receipt_transaction`(`txn_receipt_id`, `receipt_date`, `receipt_time`, `total_amount`, `payment_mode`, `status`, `remark`, `adjust_amount`,`party_id`) VALUES ('$billno1','$cdate','$scri','$credit_amt','Adjust Credit Note','Complete','$uniqueId1','$credit_amt','$pp_id1')");
							$actual_adjust_amt=$actual_adjust_amt-$credit_amt;
						}
					} 
					else if($credit_amt>0) 
					{
						$actual_adjust_amt11=round($actual_adjust_amt+$fetch_product_2['adjusted_outstanding_amt'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_party SET adjusted_outstanding_amt='$actual_adjust_amt11' where party_id='$pp_id1' and distributor_id='$ver'");
						$insert_receipt = mysqli_query($con,"INSERT IGNORE INTO `tbl_receipt_transaction`(`txn_receipt_id`,`receipt_date`, `receipt_time`, `total_amount`, `payment_mode`,`status`,`remark`,`adjust_amount`,`party_id`) VALUES ('$billno1','$cdate','$scri','$actual_adjust_amt','Adjust Credit Note','Complete','$uniqueId1','$actual_adjust_amt','$pp_id1')");
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
				$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_party_transaction where transaction_from in (select user_id from tbl_user where `distributor_id` = '$ver') and payment_status!='Complete' and payment_mode='Credit' and transaction_to='$pp_id1'");
			}
			else
			{
				$adjust_manual_billno=$_POST['manual_billno'];
				$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_party_transaction where transaction_id='$adjust_manual_billno' and transaction_from in (select user_id from tbl_user where distributor_id='$ver') and payment_status!='Complete' and payment_mode='Credit' and transaction_to='$pp_id1'");
			}
			while($fetch_pending_data=mysqli_fetch_assoc($res_purchase_adjust))
			{
				$update_txn_id=$fetch_pending_data['transaction_id'];
				$sale_credit_amt=round($fetch_pending_data['final_amt']-$fetch_pending_data['cash_amount']);
				if($sale_credit_amt==0)
					$uq1=mysqli_query($con,"UPDATE tbl_party_transaction SET payment_status='Complete' where transaction_to='$pp_id1' and transaction_id='$update_txn_id'");
				if($actual_adjust_amt>$sale_credit_amt)
				{
					if($sale_credit_amt>0)
					{
						$actual_adjust_amt11=round($sale_credit_amt+$fetch_pending_data['cash_amount']);
						$uq1=mysqli_query($con,"UPDATE tbl_party_transaction SET cash_receipt_date='$cdate',cash_amount='$actual_adjust_amt11',payment_status='Complete' where payment_mode='Credit' and transaction_to='$pp_id1' and transaction_id='$update_txn_id'");
						$insert_receipt = mysqli_query($con,"INSERT INTO `tbl_receipt_transaction`(`txn_receipt_id`, `transaction_id`, `receipt_date`, `receipt_time`, `total_amount`, `payment_mode`,`status`,`remark`,`adjust_amount`) VALUES ('$billno1','$update_txn_id','$cdate','$scri','$sale_credit_amt','Adjust Credit Note','Complete','$uniqueId1','$sale_credit_amt')");
						$actual_adjust_amt=$actual_adjust_amt-$sale_credit_amt;
					}
				}
				else if($sale_credit_amt>0)
				{
					$actual_adjust_amt11=round($actual_adjust_amt+$fetch_pending_data['cash_amount']);
					$uq1=mysqli_query($con,"UPDATE tbl_party_transaction SET cash_receipt_date='$cdate',cash_amount='$actual_adjust_amt11',payment_status='Partial Completed' where payment_mode='Credit' and transaction_to='$pp_id1' and transaction_id='$update_txn_id'");
					$insert_receipt = mysqli_query($con,"INSERT INTO `tbl_receipt_transaction`(`txn_receipt_id`, `transaction_id`, `receipt_date`, `receipt_time`, `total_amount`, `payment_mode`,`status`,`remark`,`adjust_amount`) VALUES ('$billno1','$update_txn_id','$cdate','$scri','$actual_adjust_amt','Adjust Credit Note','Complete','$uniqueId1','$actual_adjust_amt')");
					$actual_adjust_amt=0;
					break;
				}
			}
		}					
		$actual_adjust_amt_credit=$actual_adjust_amt_final-$actual_adjust_amt;
		if($actual_adjust_amt_credit>0)
		{
			$res_debit_adjust = mysqli_query($con,"SELECT * FROM tbl_party_credit_note where distributor_id='$ver' and party_id='$pp_id1' and credit_note_status='Pending' and bill_no='$billno1' and unique_bill='$uniqueId1'");
			while($fetch_pending_data11=mysqli_fetch_assoc($res_debit_adjust))
			{
				$update_txn_id=$fetch_pending_data11['creditnote_id'];
				$purchase_credit_amt=$fetch_pending_data11['final_net_amt']-$fetch_pending_data11['adjust_amount'];
				if($purchase_credit_amt==0)
					$uq1=mysqli_query($con,"UPDATE tbl_party_credit_note SET credit_note_status='Complete' where party_id='$pp_id1' and distributor_id='$ver' and creditnote_id='$update_txn_id'");
				if($actual_adjust_amt_credit>$purchase_credit_amt)
				{
					if($purchase_credit_amt>0)
					{
						$actual_adjust_amt11=round($purchase_credit_amt+$fetch_pending_data11['adjust_amount'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_party_credit_note SET update_bill_datetime='$da',adjust_amount='$actual_adjust_amt11',credit_note_status='Complete' where party_id='$pp_id1' and distributor_id='$ver' and creditnote_id='$update_txn_id'");
						$actual_adjust_amt_credit=$actual_adjust_amt_credit-$purchase_credit_amt;
					}
				}
				else if($purchase_credit_amt>0)
				{
					$actual_adjust_amt11=round($actual_adjust_amt_credit+$fetch_pending_data11['adjust_amount'],2);
					$uq1=mysqli_query($con,"UPDATE tbl_party_credit_note SET update_bill_datetime='$da',adjust_amount='$actual_adjust_amt11' where party_id='$pp_id1' and distributor_id='$ver' and creditnote_id='$update_txn_id'");
					$actual_adjust_amt_credit=0;
					break;
				}
			}
		}
	}
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver', 'INSERT+UPDATE OPERATION,Adjust Credit Note Detail#Admin(INSERT)tbl_receipt_transaction,(INSERT+UPDATE)tbl_party_credit_note,tbl_party_transaction', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	if($uq1)
	{
		$response['success']='1';
		$response['details']="Adjust Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}
echo json_encode($response);
?>
