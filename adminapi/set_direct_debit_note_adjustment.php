<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['uniquebill']) && isset($_POST['billno']))
{
	$ver = $_POST['distributor_id'];
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
	$uniquebill = $_POST['uniquebill'];
	$billno = $_POST['billno'];
	$adjusted_type = isset($_POST['adjusted_typenote']) ? $_POST['adjusted_typenote'] : 'Auto';
	
	$res1 = mysqli_query($con,"select *,sum(final_net_amt) as final_bill_amt,sum(adjust_amount) as final_adjust_amt from tbl_party_debit_note where distributor_id='$ver' and bill_no='$billno' and unique_bill='$uniquebill' and debit_note_status='Pending' group by bill_no,unique_bill");
	if(mysqli_num_rows($res1)>0)
	{     
		while($fetch_product1=mysqli_fetch_assoc($res1))
		{
			$adjust_return_amount=$fetch_product1['final_bill_amt']-$fetch_product1['final_adjust_amt'];
			$pp_id1=$fetch_product1['purchase_party_id'];
			$actual_adjust_amt=$adjust_return_amount;
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
								$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt='$actual_adjust_amt11' where purchase_party_id='$pp_id1' and distributor_id='$ver'");
								$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`,`payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`remark`,`status`, `adjust_by_receipt_bill_no`,`adjust_by_unique_bill`,`party_id`)values('$ver','$cdate','$scri','$credit_amt','Adjustment','','','Direct Debit Note','Complete','$billno','$uniquebill','$pp_id1')");
								$actual_adjust_amt=$actual_adjust_amt-$credit_amt;
							}
						} 
						else if($credit_amt>0) 
						{
							$actual_adjust_amt11=round($actual_adjust_amt+$fetch_product_2['adjusted_outstanding_amt'],2);
							$uq1=mysqli_query($con,"UPDATE tbl_purchase_party SET adjusted_outstanding_amt='$actual_adjust_amt11' where purchase_party_id='$pp_id1' and distributor_id='$ver'");
							$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`,`payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`remark`,`status`, `adjust_by_receipt_bill_no`,`adjust_by_unique_bill`,`party_id`)values('$ver','$cdate','$scri','$actual_adjust_amt','Adjustment','','','Direct Debit Note','Complete','$billno','$uniquebill','$pp_id1')");
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
					$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$ver' and txn_type='Add' and payment_mode='Credit' and party_id='$pp_id1' and payment_status='Pending'");
				}
				else
				{
					$adjust_manual_billno=explode('#$&',$_POST['manual_billno']);
					$res_purchase_adjust = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction where distributor_id='$ver' and txn_type='Add' and payment_mode='Credit' and party_id='$pp_id1' and payment_status='Pending' and bill_no='$adjust_manual_billno[0]' and unique_bill='$adjust_manual_billno[1]'");
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
							$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_adjust_amt11' where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$ver' and transaction_id='$update_txn_id'");
							
							$query = mysqli_query($con,"INSERT INTO `tbl_purchase_payment_transaction`(`distributor_id`, `payment_date`, `payment_time`, `total_amount`, `payment_mode`, `unique_bill`, `bill_no`, `remark`,`status`,`adjust_by_receipt_bill_no`,`adjust_by_unique_bill`)values('$ver','$cdate','$scri','$purchase_credit_amt','Adjustment','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['bill_no']."','Direct Debit Note','Complete','$billno','$uniquebill')");
							$actual_adjust_amt=$actual_adjust_amt-$purchase_credit_amt;
						}
					}
					else if($purchase_credit_amt>0)
					{
						$actual_adjust_amt11=round($actual_adjust_amt+$fetch_pending_data['pay_amount'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_distributor_transaction SET update_bill_datetime='$scri',pay_amount='$actual_adjust_amt11'  where payment_mode='Credit' and party_id='$pp_id1' and distributor_id='$ver' and transaction_id='$update_txn_id'");
						$query = mysqli_query($con,"INSERT INTO `tbl_purchase_payment_transaction`(`distributor_id`,`payment_date`, `payment_time`,`total_amount`,`payment_mode`,`unique_bill`,`bill_no`,`remark`,`status`, `adjust_by_receipt_bill_no`, `adjust_by_unique_bill`)values('$ver','$cdate','$scri','$actual_adjust_amt','Adjustment','".$fetch_pending_data['unique_bill']."','".$fetch_pending_data['bill_no']."','Direct Debit Note','Complete','$billno','$uniquebill')");
						$actual_adjust_amt=0;
						break;
					}
				}
			}
			$final_adjustment_amt=$adjust_return_amount-$actual_adjust_amt;			
			$actual_adjust_amt=$adjust_return_amount-$actual_adjust_amt;
			if($actual_adjust_amt>0)
			{
				$res_debit_adjust = mysqli_query($con,"SELECT * FROM tbl_party_debit_note where distributor_id='$ver' and purchase_party_id='$pp_id1' and debit_note_status='Pending' and bill_no='$billno' and unique_bill='$uniquebill'");
				while($fetch_pending_data11=mysqli_fetch_assoc($res_debit_adjust))
				{
					$update_txn_id=$fetch_pending_data11['debitnote_id'];
					$purchase_credit_amt=$fetch_pending_data11['final_net_amt']-$fetch_pending_data11['adjust_amount'];
					if($purchase_credit_amt==0)
						$uq1=mysqli_query($con,"UPDATE tbl_party_debit_note SET debit_note_status='Complete' where purchase_party_id='$pp_id1' and distributor_id='$ver' and debitnote_id='$update_txn_id'");
					if($actual_adjust_amt>$purchase_credit_amt)
					{
						if($purchase_credit_amt>0)
						{
							$actual_adjust_amt11=round($purchase_credit_amt+$fetch_pending_data11['adjust_amount'],2);
							$uq1=mysqli_query($con,"UPDATE tbl_party_debit_note SET update_bill_datetime='$scri',adjust_amount='$actual_adjust_amt11',debit_note_status='Complete' where purchase_party_id='$pp_id1' and distributor_id='$ver' and debitnote_id='$update_txn_id'");
							$actual_adjust_amt=$actual_adjust_amt-$purchase_credit_amt;
						}
					}
					else if($purchase_credit_amt>0)
					{
						$actual_adjust_amt11=round($actual_adjust_amt+$fetch_pending_data11['adjust_amount'],2);
						$uq1=mysqli_query($con,"UPDATE tbl_party_debit_note SET update_bill_datetime='$scri',adjust_amount='$actual_adjust_amt11' where purchase_party_id='$pp_id1' and distributor_id='$ver' and debitnote_id='$update_txn_id'");
						$actual_adjust_amt=0;
						break;
					}
				}
				$adjust_return_amount=$fetch_product1['final_bill_amt']-$fetch_product1['final_adjust_amt'];
				if($adjust_return_amount==$final_adjustment_amt)
					$uq11=mysqli_query($con,"UPDATE tbl_party_debit_note SET debit_note_status='Complete' where purchase_party_id='$pp_id1' and distributor_id='$ver' and debit_note_status='Pending' and bill_no='$billno' and unique_bill='$uniquebill'");
			}
			if($uq1)
			{
				$response['success']='1';
				$response['details']="Debit Note Successfully Adjust";
			}
			else
			{
				$response['success']='0';
				$response['details']="Adjustment Error";
			}
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Debit Note Bill No Not Valid or Bill Already Adjust..!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>