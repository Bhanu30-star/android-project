<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['getmonth']) && isset($_POST['getyear']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$get_month=$_POST['getmonth'];
	$get_year=$_POST['getyear'];
	$pid=$_POST['bank_id'];
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
	$bank_detail=array();
	for($hj=1;$hj<=$month_last_date;$hj++)
	{
		$tamt_opening = $tamt_closing = $tamt_bank_transfer = $tamt_expense_amt = $tamt_bank_withdraw = $tamt_sale = $clientpurchase = $tamt_receivable=$tamt_payable=0;
		if(strlen($hj)==1)
			$temp_string2="0".$hj;
		else
			$temp_string2=$hj;
		$cdate=$get_year.'-'.$get_month.'-'.$temp_string2;
		if($cdate<=$da)
		{
			$product_detail = mysqli_query($con, "SELECT * FROM tbl_distributor_bank_collection where date<='$cdate' and distributor_id='$session_dist_ver' AND bank_id='$pid' order by date DESC limit 1");
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
			$cash_other_2=mysqli_query($con,"SELECT sum(total_amount) as recamt FROM tbl_other_cash_txn_master_detail where receipt_date='$cdate' and status='Complete' and bank_id='$pid' and transaction_id in (SELECT transaction_id FROM tbl_other_cash_txn_master where distributor_id='$session_dist_ver' and status='Complete' and txn_type='To Receive')");
			if(mysqli_num_rows($cash_other_2)>0)
			{  
				while($fetch_other=mysqli_fetch_assoc($cash_other_2))
				{
					$tamt_receivable=$tamt_receivable+$fetch_other['recamt'];
				}
			}
											
			$cash_other_3=mysqli_query($con,"SELECT sum(total_amount) as payamt FROM tbl_other_cash_txn_master_detail where receipt_date='$cdate' and status='Complete' and bank_id='$pid' and transaction_id in (SELECT transaction_id FROM tbl_other_cash_txn_master where distributor_id='$session_dist_ver' and status='Complete' and txn_type!='To Receive')");
			if(mysqli_num_rows($cash_other_3)>0)
			{  
				while($fetch_other=mysqli_fetch_assoc($cash_other_3))
				{
					$tamt_payable=$tamt_payable+$fetch_other['payamt'];
				}
			}

			
			$cash_bank = mysqli_query($con, "SELECT transfer_amt,withdrawal_amt,bank_id,bank_contra_id,txn_type FROM tbl_distributor_bank_transfer where insert_date='$cdate' and distributor_id='$session_dist_ver' and status='Complete'");
            if (mysqli_num_rows($cash_bank) > 0) 
			{
                while ($fetch_bank = mysqli_fetch_assoc($cash_bank)) 
				{
					if(($fetch_bank['txn_type']=="Deposite" || $fetch_bank['txn_type']=="Cheque Deposite") and $fetch_bank['bank_id']==$pid)
						$tamt_bank_transfer = $tamt_bank_transfer + $fetch_bank['transfer_amt'];
					if($fetch_bank['txn_type']=="Deposite" and $fetch_bank['bank_contra_id']==$pid)
						$tamt_bank_withdraw = $tamt_bank_withdraw + $fetch_bank['transfer_amt'];
					if(($fetch_bank['txn_type']=="Withdrawal" || $fetch_bank['txn_type']=="Cheque Withdrawal" || $fetch_bank['txn_type']=="Cheque Bounce" || $fetch_bank['txn_type']=="Other Tax Paid") and $fetch_bank['bank_id']==$pid)
						$tamt_bank_withdraw = $tamt_bank_withdraw + $fetch_bank['withdrawal_amt'];
				}
			}
            $bank_expense = mysqli_query($con, "SELECT sum(bank_amt) as expenseamt FROM tbl_distributor_expenses_master where insert_date='$cdate' and distributor_id='$session_dist_ver' AND  payment_mode like '%Bank%' and status IN('Complete','Active') AND bank_id='$pid'");
            if (mysqli_num_rows($bank_expense) > 0) 
			{
                $fetch_expense = mysqli_fetch_assoc($bank_expense);
				$tamt_expense_amt = $tamt_expense_amt+$fetch_expense['expenseamt'];
            }
															  
			$bank_purchase=mysqli_query($con,"SELECT sum(final_net_amt) as tot_final_amt FROM `tbl_distributor_transaction` where transaction_date='$cdate' and txn_type='Add' and bank_id='$pid' and payment_status = 'Complete' and `distributor_id` = '$session_dist_ver' and payment_mode='Online'");
			if(mysqli_num_rows($bank_purchase)>0)
			{  
				$fetch_purchase=mysqli_fetch_assoc($bank_purchase);
				$clientpurchase=$clientpurchase+$fetch_purchase['tot_final_amt'];
			}
															
			$pur_receipt_detail=mysqli_query($con,"SELECT sum(total_amount) as tot_amt FROM `tbl_purchase_payment_transaction` where payment_date='$cdate' and payment_mode='Online' and `distributor_id` = '$session_dist_ver' and bank_id='$pid'");
			if(mysqli_num_rows($pur_receipt_detail)>0)
			{  
				$fetch_pur_data=mysqli_fetch_assoc($pur_receipt_detail);
				$clientpurchase=$clientpurchase+$fetch_pur_data['tot_amt'];
			}
			
			$advance_receipt_detail=mysqli_query($con,"SELECT total_amount FROM `tbl_purchase_advance_txn_detail` where receipt_date='$cdate' and payment_mode='Online' and distributor_id='$session_dist_ver' and status='Complete' and bank_id='$pid'");
			if(mysqli_num_rows($advance_receipt_detail)>0)
			{  
				while($fetch_pur_data=mysqli_fetch_assoc($advance_receipt_detail))
				{
					$clientpurchase=$clientpurchase+$fetch_pur_data['total_amount'];
				}
			}
															  
			$res12=mysqli_query($con,"SELECT sum(cheque_amount) as tot_chq_amt FROM tbl_other_receipt_txn where receipt_date='$cdate' and user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver') and status='Complete' AND bank_id='$pid'");
			if(mysqli_num_rows($res12)>0)
			{  
				$fetch_sale=mysqli_fetch_assoc($res12);
				$tamt_sale=$tamt_sale+$fetch_sale['tot_chq_amt'];
			}
															 
			$res_bank_receipt=mysqli_query($con,"SELECT sum(total_amount) as final_receipt_amt FROM tbl_receipt_transaction where receipt_date='$cdate' AND bank_id='$pid' and payment_mode in ('Online','Wallet')");
			if(mysqli_num_rows($res_bank_receipt)>0)
			{  
				$fetch_sale=mysqli_fetch_assoc($res_bank_receipt);
				$tamt_sale=$tamt_sale+$fetch_sale['final_receipt_amt'];
			}
															 
			$sale_detail=mysqli_query($con,"SELECT cheque_amount FROM `tbl_party_transaction` where transaction_date='$cdate' and payment_mode in ('Online','Wallet') and payment_status!='Converted' and bank_id='$pid' and transaction_from in (select user_id from tbl_user where `distributor_id` = '$session_dist_ver')");
			if(mysqli_num_rows($sale_detail)>0)
			{  
				while($fetch_sale=mysqli_fetch_assoc($sale_detail))
				{
					$tamt_sale=$tamt_sale+$fetch_sale['cheque_amount'];
				}
			}
			
			$bank_detail['date']=$cdate;
			$bank_detail['opening']=$tamt_opening;
			$bank_detail['bank_transfer']=$tamt_bank_transfer;
			$bank_detail['bank_withdraw']=$tamt_bank_withdraw;
			$bank_detail['sale_receipt_amt']=$tamt_sale;
			$bank_detail['purchase_receipt_amt']=$clientpurchase;
			$bank_detail['expenses']=$tamt_expense_amt;
			$bank_detail['receiable']=$tamt_receivable;
			$bank_detail['payable']=$tamt_payable;
			$bank_detail['closing']=$tamt_closing;
			$response['bank_detail'][]=$bank_detail;
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