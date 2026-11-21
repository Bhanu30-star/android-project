<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['distributor_user_id']) && isset($_POST['searchdate1']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$session_dist_ver = $_POST['distributor_id'];
	$cdate=$_POST['searchdate1'];
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_status']='1';
			$response['user_imei']=$fetch_user['imei_no'];
			$response['session_id']=$fetch_user['session_id'];
		}
	}
	else
	{
			
		$response['user_status']='0';
		$response['session_id']='';
		$response['user_imei']='';
	}
	
	$cdate11  = date("Y-m-d");
	$day_end_detail = mysqli_query($con,"select * from tbl_distributor_business_control where distributor_id='$session_dist_ver' and insert_date='$cdate11'");
	$flag_dayend=0;
	if(mysqli_num_rows($day_end_detail)==0) {
		$flag_dayend=1;
	}
	$response['client_day_end']=$flag_dayend;
	$sale_allow='No';
	$dist_sale = mysqli_query($con,"select * from tbl_distributor where distributor_id='$session_dist_ver' and sale_allowed='Yes'");
	if(mysqli_num_rows($dist_sale)>0) {
		$sale_allow='Yes';
	}
	
	$denomination=array();
	$res_denom = mysqli_query($con,"select * from tbl_denomination where status='Active' order by denomination_title DESC");
	while($fetch_denom=mysqli_fetch_assoc($res_denom)) {
		$denomination['denomination_title']=$fetch_denom['denomination_title'];
		$response['denomination'][]=$denomination;
	}
	$fse_dsr=array();
	$temp_preamt=$temp_amt=$temp_camt=$temp_chamt=$temp_credit=$flag_final=$temp_autopay_amt=0;
	$res_user=mysqli_query($con,"select * from tbl_user where status='Active' and user_type='2' and distributor_id='$session_dist_ver'");
	while($fetch_user=mysqli_fetch_assoc($res_user))
	{
		$ck=1;
		$row_flag=$row_previous_amt=$row_temp_amt=$row_temp_camt=$row_temp_chamt=$row_temp_credit=$row_autopay_amt=0;
		$temp_user_id=$fetch_user['user_id'];
		$temp_user_name=$fetch_user['user_name'];
		$res=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$temp_user_id' and tb_insertdate='$cdate' and dsr_status='Accept'");
		if(mysqli_num_rows($res)>0)
		{
			$flag_final=1;
			$row_flag=1;
			while($fetch_product2=mysqli_fetch_assoc($res))
			{
				extract($fetch_product2);
				if($ck==1)
					$temp_dsr=$dsr_id;
				else
					$temp_dsr=$temp_dsr.",".$dsr_id;
				$cdate_temp=$date;
				if($cdate_temp==$cdate)
					$row_temp_amt=$row_temp_amt+$total_amount;
				else
					$row_previous_amt=$row_previous_amt+$total_amount;
				$row_temp_camt=$row_temp_camt+$cash_detail;
				$row_temp_chamt=$row_temp_chamt+$cheque_detail+$online_amt;
															
				$res_autopay=mysqli_query($con,"SELECT final_amt FROM tbl_party_transaction where transaction_from='$temp_user_id' and payment_type='AutoPay' and transaction_date='$cdate_temp' and source not in ('Web','Admin') and bank_id>0");
				while($fetch_detail_autopay=mysqli_fetch_assoc($res_autopay))
				{
					$row_autopay_amt=$row_autopay_amt+$fetch_detail_autopay['final_amt'];
				}
				$credit_txn_amount=0;
				$res_credit=mysqli_query($con,"SELECT * FROM tbl_party_transaction where payment_status!='Complete' and transaction_from='$temp_user_id' and payment_mode='Credit' and transaction_date='$cdate_temp' and source not in ('Web','Admin')");
				while($fetch_detail_credit=mysqli_fetch_assoc($res_credit))
				{
					$credit_txn_amount=$credit_txn_amount+$fetch_detail_credit['final_amt'];
					$get_txn_id=$fetch_detail_credit['transaction_id'];
					$res_credit_cash=mysqli_query($con,"SELECT sum(total_amount) as rec_cash_amt FROM tbl_receipt_transaction where transaction_id='$get_txn_id' and receipt_date='$cdate_temp' and source not in ('Web','Admin')");
					$temp_cash_txn_amt=0;
					while($fetch_detail_cash=mysqli_fetch_assoc($res_credit_cash))
					{
						$temp_cash_txn_amt=$fetch_detail_cash['rec_cash_amt'];
					}
					$credit_txn_amount=$credit_txn_amount-$temp_cash_txn_amt;	
				}
				$row_temp_credit=$row_temp_credit+$credit_txn_amount;
				if($cdate_temp==$cdate)
					$row_temp_amt=$row_temp_amt+$credit_txn_amount;
				else
					$row_previous_amt=$row_previous_amt+$credit_txn_amount;
				$ck++;
			}
			$temp_camt=$temp_camt+$row_temp_camt;
			$temp_chamt=$temp_chamt+$row_temp_chamt;
			$temp_credit=$temp_credit+$row_temp_credit;
			$temp_amt=$temp_amt+$row_temp_amt;
			$temp_preamt=$temp_preamt+$row_previous_amt;
			$temp_autopay_amt=$temp_autopay_amt+$row_autopay_amt;
		}
		if($row_flag==1) 
		{											
			$fse_dsr['fse_id']=$temp_user_id;
			$fse_dsr['fse_name']=$temp_user_name;
			$fse_dsr['row_previous_amt']=$row_previous_amt;
			$fse_dsr['today_amt']=$row_temp_amt;
			
			$fse_dsr_denomination=array();
			$fse_dsr['fse_dsr_denomination']=array();
			$res_denom1 = mysqli_query($con,"select *  from tbl_denomination where status='Active' order by denomination_title DESC");
			while($fetch_denom1=mysqli_fetch_assoc($res_denom1))
			{	
				$temp_demon_id=$fetch_denom1['denomination_id'];
				$fse_dsr_denomination['denomination_title']=$fetch_denom1['denomination_title'];
				$res_detail=mysqli_query($con,"SELECT sum(total_count) as ttcount FROM tbl_dsr_cashDetail where denomination_id='$temp_demon_id' and dsr_id in ($temp_dsr)");
				if(mysqli_num_rows($res_detail)>0)
				{
					while($fetch_detail=mysqli_fetch_assoc($res_detail))
					{
						if($fetch_detail['ttcount']>0)
							$fse_dsr_denomination['denomination_count']=$fetch_detail['ttcount'];
						else
							$fse_dsr_denomination['denomination_count']='0';
					}
				}
				else
				{
					$fse_dsr_denomination['denomination_count']='0';
				}
				$fse_dsr['fse_dsr_denomination'][]=$fse_dsr_denomination;
			}
			
			$fse_dsr['row_temp_cheque_amt']=$row_temp_chamt;
			$fse_dsr['row_temp_cash_amt']=$row_temp_camt;
			$fse_dsr['row_temp_credit_amt']=$row_temp_credit;
			$fse_dsr['row_autopay_amt']=$row_autopay_amt;
			$response['fse_dsr'][]=$fse_dsr;
		}
		else
		{
			$fse_dsr['fse_id']=$temp_user_id;
			$fse_dsr['fse_name']=$temp_user_name;
			$fse_dsr['row_previous_amt']='0';
			$fse_dsr['today_amt']='0';
			$fse_dsr_denomination=array();
			$fse_dsr['fse_dsr_denomination']=array();
			$res_denom1 = mysqli_query($con,"select *  from tbl_denomination where status='Active' order by denomination_title DESC");
			while($fetch_denom1=mysqli_fetch_assoc($res_denom1))
			{	
				$fse_dsr_denomination['denomination_title']=$fetch_denom1['denomination_title'];
				$fse_dsr_denomination['denomination_count']='0';
				$fse_dsr['fse_dsr_denomination'][]=$fse_dsr_denomination;
			}
			$fse_dsr['row_temp_cheque_amt']='0';
			$fse_dsr['row_temp_cash_amt']='0';
			$fse_dsr['row_temp_credit_amt']='0';
			$fse_dsr['row_autopay_amt']='0';
			$response['fse_dsr'][]=$fse_dsr;
		}
	}		
	if($flag_final==1) 
	{
		$response['dsr_submit']='1';
		$response['total_pre_amt']=$temp_preamt;
		$response['total_today_amt']=$temp_amt;
		$response['total_cheque_amt']=$temp_chamt;
		$response['total_cash_amt']=$temp_camt;
		$response['total_credit_amt']=$temp_credit;
		$response['total_autopay_amt']=$temp_autopay_amt;
	}		
	else
	{
		$response['dsr_submit']='0';
		$response['total_pre_amt']='0';
		$response['total_today_amt']='0';
		$response['total_cheque_amt']='0';
		$response['total_cash_amt']='0';
		$response['total_credit_amt']='0';
		$response['total_autopay_amt']='0';
	}
	
	if($sale_allow=='Yes')
	{
		$dist_total_amt=0;
		$dist_total_cash=0;
		$dist_total_cheq=0;
		$dist_total_credit=0;
		$res_dist_val=mysqli_query($con,"SELECT * FROM tbl_party_transaction where transaction_from in (select user_id from tbl_user where `distributor_id` = '$session_dist_ver') and transaction_date='$cdate' and converted_transaction_id='' and source in ('Web','Admin')");
		while($fetch_dist_val=mysqli_fetch_array($res_dist_val))
		{
			$dist_total_amt=$dist_total_amt+$fetch_dist_val['final_amt'];
			if($fetch_dist_val['payment_mode']=="Credit")
			{
				$dist_total_credit=$dist_total_credit+$fetch_dist_val['final_amt'];
				$get_txn_id=$fetch_dist_val['transaction_id'];
				$res_credit_cash=mysqli_query($con,"SELECT sum(cash_amount) as rec_cash_amt,sum(cheque_amount) as rec_cheque_amt FROM tbl_receipt_transaction where transaction_id='$get_txn_id' and receipt_date='$cdate' and source in ('Web','Admin')");
				$temp_cash_txn_amt=0;
				$temp_cheque_txn_amt=0;
				while($fetch_detail_cash=mysqli_fetch_assoc($res_credit_cash))
				{
					$temp_cash_txn_amt=$fetch_detail_cash['rec_cash_amt'];
					$temp_cheque_txn_amt=$fetch_detail_cash['rec_cheque_amt'];
				}
				$dist_total_credit=$dist_total_credit-$temp_cash_txn_amt-$temp_cheque_txn_amt;	
				$dist_total_cash=$dist_total_cash+$temp_cash_txn_amt;
				$dist_total_cheq=$dist_total_cheq+$temp_cheque_txn_amt;
			}
			else
			{
				$dist_total_cash=$dist_total_cash+$fetch_dist_val['cash_amount'];
				$dist_total_cheq=$dist_total_cheq+$fetch_dist_val['cheque_amount'];
			}
		}
		$res11=mysqli_query($con,"SELECT tbl_receipt_transaction.total_amount,tbl_receipt_transaction.cash_amount, tbl_receipt_transaction.cheque_amount FROM tbl_receipt_transaction,tbl_party_transaction where tbl_party_transaction.transaction_id = tbl_receipt_transaction.transaction_id and tbl_receipt_transaction.receipt_date='$cdate' and tbl_receipt_transaction.generated_user_id in (select distributor_id from tbl_distributor where distributor_id='$session_dist_ver') and tbl_party_transaction.transaction_date!='$cdate' and tbl_receipt_transaction.source in ('Web','Admin')");
		if(mysqli_num_rows($res11)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res11))
			{
				extract($fetch_product21);
				$dist_total_cash=$dist_total_cash+$fetch_product21['cash_amount'];
				$dist_total_cheq=$dist_total_cheq+$fetch_product21['cheque_amount'];
			}
		}
													
		$res15=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn where user_id in (select user_id from tbl_user where distributor_id='$session_dist_ver') and receipt_date='$cdate' and status='Complete' and source in ('Web','Admin')");
		if(mysqli_num_rows($res15)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res15))
			{
				extract($fetch_product21);
				$dist_total_cash=$dist_total_cash+$fetch_product21['cash_amount'];
				$dist_total_cheq=$dist_total_cheq+$fetch_product21['cheque_amount'];
			}
		}
													
		$res16=mysqli_query($con,"SELECT * FROM tbl_receipt_transaction where generated_user_id in (select distributor_id from tbl_distributor where distributor_id='$session_dist_ver') and receipt_date='$cdate' and status='Complete' and source in ('Web','Admin') and transaction_id='0' and party_id>'0'");
		if(mysqli_num_rows($res16)>0)
		{     
			while($fetch_product21=mysqli_fetch_assoc($res16))
			{
				extract($fetch_product21);
				$dist_total_cash=$dist_total_cash+$fetch_product21['cash_amount'];
				$dist_total_cheq=$dist_total_cheq+$fetch_product21['cheque_amount'];
			}
		}
		$response['client_total_amount']=$dist_total_amt;
		$response['client_total_cash_amount']=$dist_total_cash;
		$response['client_total_cheque_amount']=$dist_total_cheq;
		$response['client_total_credit_amount']=$dist_total_credit;
		
		
		$response['final_client_total_amount']=$dist_total_amt+$temp_preamt+$temp_amt;
		$response['final_client_total_cash_amount']=$dist_total_cash+$tamt_total;
		$response['final_client_total_cheque_amount']=$dist_total_cheq+$temp_chamt;
		$response['final_client_total_credit_amount']=$dist_total_credit+$temp_credit;
		
		
		$credit_txn_detail=array();
		$tamt_total_party1=$tamt_received_party1=$tamt_pending_party1=0;
		$res_user11 = mysqli_query($con,"select user_id,user_name from tbl_user where status='Active' and user_type='2' and distributor_id='$session_dist_ver'");
		while($fetch_user=mysqli_fetch_assoc($res_user11))
		{
			$temp_user_id=$fetch_user['user_id'];
			$temp_user_name=$fetch_user['user_name'];
			$res=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$temp_user_id' and tb_insertdate='$cdate' and dsr_status='Accept'");
			if(mysqli_num_rows($res)>0)
			{
				while($fetch_product2=mysqli_fetch_assoc($res))
				{
					$cdate_temp=$fetch_product2['date'];
					$res_party_credit1=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.payment_status!='Complete' and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.payment_mode='Credit' and tbl_party_transaction.transaction_date='$cdate_temp'");
					while($fetch_detail_credit=mysqli_fetch_assoc($res_party_credit1))
					{
						$credit_txn_amount=0;
						$credit_txn_amount=$credit_txn_amount+$fetch_detail_credit['final_amt'];
						$get_txn_id=$fetch_detail_credit['transaction_id'];
						$res_credit_cash=mysqli_query($con,"SELECT sum(total_amount) as rec_cash_amt FROM tbl_receipt_transaction where transaction_id='$get_txn_id' and receipt_date='$cdate_temp'");
						$temp_cash_txn_amt=0;
						while($fetch_detail_cash=mysqli_fetch_assoc($res_credit_cash))
						{
							$temp_cash_txn_amt=$fetch_detail_cash['rec_cash_amt'];
						}	
						$tamt_total_party1=$tamt_total_party1+$credit_txn_amount;	
						$tamt_received_party1=$tamt_received_party1+$temp_cash_txn_amt;	
						$tamt_pending_party1=$tamt_pending_party1+$credit_txn_amount-$temp_cash_txn_amt;
						
						$credit_txn_detail['party_detail']=$fetch_detail_credit['party_name'].' - '.$fetch_detail_credit['party_phone'];
						$credit_txn_detail['fse_name']=$temp_user_name;
						$credit_txn_detail['txn_date']=$cdate_temp;
						$credit_txn_detail['total_txn_amount']=$credit_txn_amount;
						$credit_txn_detail['cash_txn_amt']=$temp_cash_txn_amt;
						$credit_txn_detail['pending_amt']=$credit_txn_amount-$temp_cash_txn_amt;
						$response['credit_txn_detail'][]=$credit_txn_detail;
						$credit_txn_amount=0;
					}
				}
			}
		}
		$credit_txn_detail['party_detail']='Total';
		$credit_txn_detail['fse_name']='';
		$credit_txn_detail['txn_date']='';
		$credit_txn_detail['total_txn_amount']=$tamt_total_party1;
		$credit_txn_detail['cash_txn_amt']=$tamt_received_party1;
		$credit_txn_detail['pending_amt']=$tamt_pending_party1;
		$response['credit_txn_detail'][]=$credit_txn_detail;
		
		$cheque_txn_detail=array();
		$tamt_total_party=0;
		$res_user12 = mysqli_query($con,"select user_id,user_name from tbl_user where status='Active' and user_type='2' and distributor_id='$session_dist_ver'");
		while($fetch_user=mysqli_fetch_assoc($res_user12))
		{
			$temp_user_id=$fetch_user['user_id'];
			$temp_user_name=$fetch_user['user_name'];
			$res=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$temp_user_id' and tb_insertdate='$cdate' and dsr_status='Accept'");
			if(mysqli_num_rows($res)>0)
			{
				while($fetch_product2=mysqli_fetch_assoc($res))
				{
					$cdate_temp=$fetch_product2['date'];
					$res_party=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.payment_status='Complete' and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.payment_mode in ('Cheque','Both') and tbl_party_transaction.bill_type!='Payout' and  tbl_party_transaction.transaction_date='$cdate_temp'");
					while($fetch_detail_party=mysqli_fetch_assoc($res_party))
					{
						$tamt_total_party=$tamt_total_party+$fetch_detail_party['cheque_amount'];	
						
						$cheque_txn_detail['party_detail']=$fetch_detail_party['party_name'].' - '.$fetch_detail_party['party_phone'];
						$cheque_txn_detail['fse_name']=$temp_user_name;
						$cheque_txn_detail['transaction_bill_number']=$fetch_detail_party['transaction_bill_number'];
						$cheque_txn_detail['txn_date']=$fetch_detail_party['transaction_date'];
						$cheque_txn_detail['cheque_neft_no']=$fetch_detail_party['cheque_no'];
						$cheque_txn_detail['cheque_amount']=$fetch_detail_party['cheque_amount'];
						$response['cheque_txn_detail'][]=$cheque_txn_detail;
					}
					$res_party1=mysqli_query($con,"SELECT tbl_party.party_name,tbl_party.party_phone,tbl_receipt_transaction.cheque_no, tbl_receipt_transaction.cheque_amount,tbl_party_transaction.transaction_bill_number,tbl_party_transaction.transaction_date FROM tbl_party_transaction,tbl_party,tbl_receipt_transaction where tbl_party_transaction.transaction_to =tbl_party.party_id and tbl_party_transaction.transaction_id=tbl_receipt_transaction.transaction_id and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_receipt_transaction.payment_mode in ('Cheque','Both') and  tbl_receipt_transaction.receipt_date='$cdate_temp'");
					while($fetch_detail_party1=mysqli_fetch_assoc($res_party1))
					{
						$tamt_total_party=$tamt_total_party+$fetch_detail_party1['cheque_amount'];
						$cheque_txn_detail['party_detail']=$fetch_detail_party1['party_name'].' - '.$fetch_detail_party1['party_phone'];
						$cheque_txn_detail['fse_name']=$temp_user_name;
						$cheque_txn_detail['transaction_bill_number']=$fetch_detail_party1['transaction_bill_number'];
						$cheque_txn_detail['txn_date']=$fetch_detail_party1['transaction_date'];
						$cheque_txn_detail['cheque_neft_no']=$fetch_detail_party1['cheque_no'];
						$cheque_txn_detail['cheque_amount']=$fetch_detail_party1['cheque_amount'];
						$response['cheque_txn_detail'][]=$cheque_txn_detail;
					}
					$res_party_other=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.user_id='$temp_user_id' and tbl_other_receipt_txn.payment_mode in ('Cheque','Both') and  tbl_other_receipt_txn.receipt_date='$cdate_temp'");
					while($fetch_detail_other=mysqli_fetch_assoc($res_party_other))
					{
						$tamt_total_party=$tamt_total_party+$fetch_detail_other['cheque_amount'];
						
						$cheque_txn_detail['party_detail']=$fetch_detail_other['party_name'].' - '.$fetch_detail_other['party_phone'];
						$cheque_txn_detail['fse_name']=$temp_user_name;
						$cheque_txn_detail['transaction_bill_number']=$fetch_detail_other['user_receipt_id'];
						$cheque_txn_detail['txn_date']=$fetch_detail_other['receipt_date'];
						$cheque_txn_detail['cheque_neft_no']=$fetch_detail_other['cheque_no'];
						$cheque_txn_detail['cheque_amount']=$fetch_detail_other['cheque_amount'];
						$response['cheque_txn_detail'][]=$cheque_txn_detail;
					}
				}
			}
		}
		$cheque_txn_detail['party_detail']='Total';
		$cheque_txn_detail['fse_name']='';
		$cheque_txn_detail['transaction_bill_number']='';
		$cheque_txn_detail['txn_date']='';
		$cheque_txn_detail['cheque_neft_no']='';
		$cheque_txn_detail['cheque_amount']=$tamt_total_party;
		$response['cheque_txn_detail'][]=$cheque_txn_detail;
		
		$cash_against_credit_txn_detail=array();
		
		$tamt_total_cashcredit=0;
		$tamt_credit_amt=0;
		$res_user13 = mysqli_query($con,"select user_id,user_name from tbl_user where status='Active' and user_type='2' and distributor_id='$session_dist_ver'");
		while($fetch_user=mysqli_fetch_assoc($res_user13))
		{
			$temp_user_id=$fetch_user['user_id'];
			$temp_user_name=$fetch_user['user_name'];
			$res=mysqli_query($con,"SELECT * FROM tbl_dsr where user_id='$temp_user_id' and tb_insertdate='$cdate' and dsr_status='Accept'");
			if(mysqli_num_rows($res)>0)
			{
				while($fetch_product2=mysqli_fetch_assoc($res))
				{
					$cdate_temp=$fetch_product2['date'];
					$res_party_credit1=mysqli_query($con,"SELECT tbl_party.party_name,tbl_party.party_phone, tbl_receipt_transaction.cash_amount,tbl_party_transaction.transaction_bill_number, tbl_party_transaction.transaction_date, tbl_receipt_transaction.txn_receipt_id FROM tbl_party_transaction, tbl_party, tbl_receipt_transaction where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_id = tbl_receipt_transaction.transaction_id and tbl_party_transaction.transaction_from='$temp_user_id' and tbl_party_transaction.payment_mode='Credit' and tbl_receipt_transaction.payment_mode!='Cheque' and tbl_party_transaction.payment_status!='Pending' and  tbl_receipt_transaction.receipt_date='$cdate_temp'");
					while($fetch_detail_credit=mysqli_fetch_assoc($res_party_credit1))
					{
						$party_name51=$fetch_detail_credit['party_name'].' - '.$fetch_detail_credit['party_phone'];
						$bill_no51=$fetch_detail_credit['transaction_bill_number'];
						$bill_date51=$fetch_detail_credit['transaction_date'];
						$tamt_credit_amt=$fetch_detail_credit['cash_amount'];	
						$tamt_total_cashcredit=$tamt_total_cashcredit+$tamt_credit_amt;	
						
						$cash_against_credit_txn_detail['party_detail']=$party_name51;
						$cash_against_credit_txn_detail['fse_name']=$temp_user_name;
						$cash_against_credit_txn_detail['transaction_bill_number']=$bill_no51;
						$cash_against_credit_txn_detail['receipt_no']=$fetch_detail_credit['txn_receipt_id'];
						$cash_against_credit_txn_detail['txn_date']=$bill_date51;
						$cash_against_credit_txn_detail['total_amt']=$tamt_credit_amt;
						$response['cash_against_credit_txn_detail'][]=$cash_against_credit_txn_detail;
						$tamt_credit_amt=0;
					}
					$res_party_additional=mysqli_query($con,"SELECT tbl_party.party_name,tbl_party.party_phone, tbl_receipt_transaction.cash_amount,tbl_party_transaction.transaction_bill_number, tbl_party_transaction.transaction_date, tbl_receipt_transaction.txn_receipt_id FROM tbl_party_transaction,tbl_party, tbl_receipt_transaction where tbl_party_transaction.transaction_to =tbl_party.party_id and tbl_party_transaction.transaction_id = tbl_receipt_transaction.transaction_id and tbl_receipt_transaction.submitted_by='$temp_user_id' and tbl_party_transaction.payment_mode='Credit' and tbl_receipt_transaction.payment_mode!='Cheque' and tbl_party_transaction.payment_status!='Pending' and  tbl_receipt_transaction.receipt_date='$cdate_temp'");
					while($fetch_detail_credit=mysqli_fetch_assoc($res_party_additional))
					{
						$party_name51=$fetch_detail_credit['party_name'].' - '.$fetch_detail_credit['party_phone'];
						$bill_no51=$fetch_detail_credit['transaction_bill_number'];
						$bill_date51=$fetch_detail_credit['transaction_date'];
						$tamt_credit_amt=$fetch_detail_credit['cash_amount'];	
						$tamt_total_cashcredit=$tamt_total_cashcredit+$tamt_credit_amt;	
		
						$cash_against_credit_txn_detail['party_detail']=$party_name51;
						$cash_against_credit_txn_detail['fse_name']=$temp_user_name;
						$cash_against_credit_txn_detail['transaction_bill_number']=$bill_no51;
						$cash_against_credit_txn_detail['receipt_no']=$fetch_detail_credit['txn_receipt_id'];
						$cash_against_credit_txn_detail['txn_date']=$bill_date51;
						$cash_against_credit_txn_detail['total_amt']=$tamt_credit_amt;
						$response['cash_against_credit_txn_detail'][]=$cash_against_credit_txn_detail;
					}
					$res_party_other1=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.user_id='$temp_user_id' and tbl_other_receipt_txn.payment_mode!='Cheque' and  tbl_other_receipt_txn.receipt_date='$cdate_temp'");
					while($fetch_detail_other1=mysqli_fetch_assoc($res_party_other1))
					{
						$tamt_total_cashcredit=$tamt_total_cashcredit+$fetch_detail_other1['cash_amount'];
						$cash_against_credit_txn_detail['party_detail']=$fetch_detail_other1['party_name'].' - '.$fetch_detail_other1['party_phone'];
						$cash_against_credit_txn_detail['fse_name']=$temp_user_name;
						$cash_against_credit_txn_detail['transaction_bill_number']='';
						$cash_against_credit_txn_detail['receipt_no']=$fetch_detail_other1['user_receipt_id'];
						$cash_against_credit_txn_detail['txn_date']=date("d-M-Y", strtotime($fetch_detail_other1['receipt_date']));
						$cash_against_credit_txn_detail['total_amt']=$fetch_detail_other1['cash_amount'];
						$response['cash_against_credit_txn_detail'][]=$cash_against_credit_txn_detail;
					}
				}
			}
		}
		$cash_against_credit_txn_detail['party_detail']='Total';
		$cash_against_credit_txn_detail['fse_name']='';
		$cash_against_credit_txn_detail['transaction_bill_number']='';
		$cash_against_credit_txn_detail['receipt_no']='';
		$cash_against_credit_txn_detail['txn_date']='';
		$cash_against_credit_txn_detail['total_amt']=$tamt_total_cashcredit;
		$response['cash_against_credit_txn_detail'][]=$cash_against_credit_txn_detail;
	}
	
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>