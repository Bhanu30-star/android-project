<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['getmonth']) && isset($_POST['getyear']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$get_month=$_POST['getmonth'];
	$get_year=$_POST['getyear'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da=date("Y-m-d");
	$get_month_date=$get_year.'-'.$get_month.'-01';
	$month_last_date=date("t", strtotime($get_month_date));
	$cash_detail=array();
	for($hj=1;$hj<=$month_last_date;$hj++)
	{
		$tamt_opening=$tamt_closing=$tamt_bank_transfer=$tamt_expense_amt=$dsramt=$clientsale=$clientpurchase=$tamt_bank_withdl=$tamt_receivable=$tamt_payable=0;
		if(strlen($hj)==1)
			$temp_string2="0".$hj;
		else
			$temp_string2=$hj;
		$cdate=$get_year.'-'.$get_month.'-'.$temp_string2;
		if($cdate<=$da)
		{
			$product_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_cash_collection where date<='$cdate' and distributor_id='$session_dist_ver' order by date DESC limit 1");
			if(mysqli_num_rows($product_detail)>0)
			{  
				while($fetch_detail=mysqli_fetch_array($product_detail))
				{
					if($fetch_detail['date']==$cdate)
					{
						$tamt_opening=$fetch_detail['opening_amt'];
						$tamt_closing=$fetch_detail['closing_amt'];
					}
					else
					{
						$tamt_opening=$fetch_detail['closing_amt'];
						$tamt_closing=$fetch_detail['closing_amt'];
					}
				}
			}	
			
			$cash_other=mysqli_query($con,"SELECT sum(txn_amount) as payamt FROM tbl_other_cash_txn_master where insert_date='$cdate' and distributor_id='$session_dist_ver' and status='Complete' and txn_type='To Receive'");
			if(mysqli_num_rows($cash_other)>0)
			{  
				while($fetch_other=mysqli_fetch_assoc($cash_other))
				{
					$tamt_payable=$tamt_payable+$fetch_other['payamt'];
				}
			}
											
											
			$cash_other_1=mysqli_query($con,"SELECT sum(txn_amount) as recamt FROM tbl_other_cash_txn_master where insert_date='$cdate' and distributor_id='$session_dist_ver' and status='Complete' and txn_type!='To Receive'");
			if(mysqli_num_rows($cash_other_1)>0)
			{  
				while($fetch_other=mysqli_fetch_assoc($cash_other_1))
				{
					$tamt_receivable=$tamt_receivable+$fetch_other['recamt'];
				}
			}
											
			$cash_other_2=mysqli_query($con,"SELECT sum(total_amount) as recamt FROM tbl_other_cash_txn_master_detail where receipt_date='$cdate' and status='Complete' and payment_mode='Cash' and bank_id='0' and transaction_id in (SELECT transaction_id FROM tbl_other_cash_txn_master where distributor_id='$session_dist_ver' and status='Complete' and txn_type='To Receive')");
			if(mysqli_num_rows($cash_other_2)>0)
			{  
				while($fetch_other=mysqli_fetch_assoc($cash_other_2))
				{
					$tamt_receivable=$tamt_receivable+$fetch_other['recamt'];
				}
			}
											
			$cash_other_3=mysqli_query($con,"SELECT sum(total_amount) as payamt FROM tbl_other_cash_txn_master_detail where receipt_date='$cdate' and status='Complete' and payment_mode='Cash' and bank_id='0' and transaction_id in (SELECT transaction_id FROM tbl_other_cash_txn_master where distributor_id='$session_dist_ver' and status='Complete' and txn_type!='To Receive')");
			if(mysqli_num_rows($cash_other_3)>0)
			{  
				while($fetch_other=mysqli_fetch_assoc($cash_other_3))
				{
					$tamt_payable=$tamt_payable+$fetch_other['payamt'];
				}
			}						

			
			$cash_bank=mysqli_query($con,"SELECT sum(transfer_amt) as transbank,sum(withdrawal_amt) as withdl_amt FROM tbl_distributor_bank_transfer where insert_date='$cdate' and distributor_id='$session_dist_ver' and status='Complete' and bank_contra_id='0' and txn_type in ('Withdrawal','Deposite')");
			if(mysqli_num_rows($cash_bank)>0)
			{  
				while($fetch_bank=mysqli_fetch_assoc($cash_bank))
				{
					$tamt_bank_transfer=$tamt_bank_transfer+$fetch_bank['transbank'];
					$tamt_bank_withdl=$tamt_bank_withdl+$fetch_bank['withdl_amt'];
				}
			}		

			$dsr_detail=mysqli_query($con,"select cash_detail from tbl_dsr where dsr_status= 'Accept' and tb_insertdate ='$cdate' and user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver')");
			if(mysqli_num_rows($dsr_detail)>0)
			{  
				while($fetch_dsr=mysqli_fetch_assoc($dsr_detail))
				{
					$dsramt=$dsramt+$fetch_dsr['cash_detail'];
				}
			}
			
			$purchase_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_purchase_party, tbl_distributor_transaction_charges where tbl_distributor_transaction.unique_bill = tbl_distributor_transaction_charges.unique_bill and tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.transaction_date='$cdate' and tbl_distributor_transaction.txn_type = 'Add' and tbl_distributor_transaction.payment_mode='Cash' and tbl_distributor_transaction.payment_status='Complete' and tbl_distributor_transaction.distributor_id ='$session_dist_ver' group by tbl_distributor_transaction.unique_bill, tbl_distributor_transaction.bill_no");
			if(mysqli_num_rows($purchase_detail)>0)
			{  
				while($fetch_purchase=mysqli_fetch_assoc($purchase_detail))
				{
					$clientpurchase=$clientpurchase+round($fetch_purchase['net_amt'],2);
				}
			}
															
			$pur_receipt_detail=mysqli_query($con,"SELECT total_amount FROM `tbl_purchase_payment_transaction` where payment_date='$cdate' and payment_mode='Cash' and `distributor_id` = '$session_dist_ver'");
			if(mysqli_num_rows($pur_receipt_detail)>0)
			{  
				while($fetch_pur_data=mysqli_fetch_assoc($pur_receipt_detail))
				{
					$clientpurchase=$clientpurchase+$fetch_pur_data['total_amount'];
				}
			}
			
			$advance_receipt_detail=mysqli_query($con,"SELECT total_amount FROM `tbl_purchase_advance_txn_detail` where receipt_date='$cdate' and payment_mode='Cash' and distributor_id='$session_dist_ver' and status='Complete'");
			if(mysqli_num_rows($advance_receipt_detail)>0)
			{  
				while($fetch_pur_data=mysqli_fetch_assoc($advance_receipt_detail))
				{
					$clientpurchase=$clientpurchase+$fetch_pur_data['total_amount'];
				}
			}
															
			$sale_detail=mysqli_query($con,"SELECT cash_amount FROM `tbl_party_transaction` where transaction_date='$cdate' and source in ('Admin','Web') and payment_mode in ('Cash','Both') and payment_status!='Converted' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$session_dist_ver')");
			if(mysqli_num_rows($sale_detail)>0)
			{  
				while($fetch_sale=mysqli_fetch_assoc($sale_detail))
				{
					$clientsale=$clientsale+$fetch_sale['cash_amount'];
				}
			}
															
			$res_opening=mysqli_query($con,"SELECT cash_amount FROM tbl_receipt_transaction where receipt_date='$cdate' and party_id in (select party_id from tbl_party where distributor_id='$session_dist_ver') and status='Complete' and source in ('Web','Admin') and payment_mode in ('Cash','Both')");
			if(mysqli_num_rows($res_opening)>0)
			{  
				while($fetch_sale=mysqli_fetch_assoc($res_opening))
				{
					$clientsale=$clientsale+$fetch_sale['cash_amount'];
				}
			}
															
			$res11=mysqli_query($con,"SELECT tbl_receipt_transaction.cash_amount FROM tbl_receipt_transaction,tbl_party_transaction where tbl_party_transaction.transaction_id=tbl_receipt_transaction.transaction_id and tbl_receipt_transaction.receipt_date='$cdate' and tbl_party_transaction.transaction_from in (select user_id from tbl_user where distributor_id='$session_dist_ver') and tbl_party_transaction.payment_status!='Converted' and tbl_receipt_transaction.source in ('Web','Admin') and tbl_receipt_transaction.payment_mode in ('Cash','Both')");
			if(mysqli_num_rows($res11)>0)
			{  
				while($fetch_sale=mysqli_fetch_assoc($res11))
				{
					$clientsale=$clientsale+$fetch_sale['cash_amount'];
				}
			}
															
			$res12=mysqli_query($con,"SELECT cash_amount FROM tbl_other_receipt_txn where receipt_date='$cdate' and user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver') and status='Complete' and source in ('Web','Admin')");
			if(mysqli_num_rows($res12)>0)
			{  
				while($fetch_sale=mysqli_fetch_assoc($res12))
				{
					$clientsale=$clientsale+$fetch_sale['cash_amount'];
				}
			}
			
			$cash_expense=mysqli_query($con,"SELECT sum(cash_amt) as expenseamt FROM tbl_distributor_expenses_master where insert_date='$cdate' and distributor_id='$session_dist_ver' and status='Complete'");
			if(mysqli_num_rows($cash_expense)>0)
			{  
				while($fetch_expense=mysqli_fetch_assoc($cash_expense))
				{
					$tamt_expense_amt=$tamt_expense_amt+$fetch_expense['expenseamt'];
				}
			}
			$cash_detail['date']=$cdate;
			$cash_detail['opening']=$tamt_opening;
			$cash_detail['bank_transfer']=$tamt_bank_transfer;
			$cash_detail['bank_withdrawal']=$tamt_bank_withdl;
			$cash_detail['expenses']=$tamt_expense_amt;
			$cash_detail['dsr_amt']=$dsramt;
			$cash_detail['sale_receipt_amt']=$clientsale;
			$cash_detail['purchase_receipt_amt']=$clientpurchase;
			
			$cash_detail['receiable']=$tamt_receivable;
			$cash_detail['payable']=$tamt_payable;
			
			$cash_detail['closing']=$tamt_closing;
			$response['cash_detail'][]=$cash_detail;
		}
	}
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['message']="Required Field Missing";
}	
echo json_encode($response);
?>