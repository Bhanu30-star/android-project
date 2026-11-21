<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']) && isset($_POST['bank_id']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['start_date'];
	$cdate2=$_POST['end_date'];
	$bankid=$_POST['bank_id'];
	$tamt_opening=0;
	$product_detail = mysqli_query($con,"SELECT opening_amt,closing_amt,date FROM tbl_distributor_bank_collection where date<='$cdate1' and distributor_id='$session_dist_ver' AND bank_id='$bankid' order by date DESC limit 1");
	$fetch_closing=mysqli_fetch_array($product_detail);
	if(mysqli_num_rows($product_detail)>0)
	{
		if($fetch_closing['date']==$cdate1)
			$tamt_opening=$fetch_closing['opening_amt'];
		else
			$tamt_opening=$fetch_closing['closing_amt'];
	}
	$response['opening_amount']=strval ($tamt_opening);
	
	$bank_flow_detail=array();
	$money_in_amount=0;
	$cash_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_transfer where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Complete' and txn_type in ('Deposite','Cheque Deposite')");
	if(mysqli_num_rows($cash_bank)>0)
	{  
		while($fetch_bank=mysqli_fetch_assoc($cash_bank))
		{
			if($fetch_bank['bank_id']==$bankid)
			{
				$money_in_amount=$money_in_amount+$fetch_bank['transfer_amt'];
				$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
				$bank_flow_detail['Party_Name']=$fetch_bank['remark'];
				$bank_flow_detail['Bill_No']=$fetch_bank['transaction_id'];
				$bank_flow_detail['Source']='Deposit';
				$bank_flow_detail['Amount']=$fetch_bank['transfer_amt'];
				$bank_flow_detail['type']='Money In';
				$response['bank_flow_detail'][]=$bank_flow_detail;
			}
		}
	}
	$sale_detail = mysqli_query($con,"select * from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to =tbl_party.party_id and tbl_party_transaction.payment_status= 'Complete' and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type!='Receipt' and tbl_party_transaction.source in ('Admin','Web') and tbl_party_transaction.payment_mode in ('Online','Wallet') and tbl_party_transaction.bank_id='$bankid' and tbl_party_transaction.payment_status!='Converted'");
	if(mysqli_num_rows($sale_detail)>0)
	{  
		while($fetch_sale=mysqli_fetch_assoc($sale_detail))
		{
			$money_in_amount=$money_in_amount+$fetch_sale['cheque_amount'];	
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_sale['transaction_date']));
			$bank_flow_detail['Party_Name']=$fetch_sale['party_name'].' - '.$fetch_sale['party_phone'];
			$bank_flow_detail['Bill_No']=$fetch_sale['transaction_bill_number'];
			$bank_flow_detail['Source']='Sale';
			$bank_flow_detail['Amount']=$fetch_sale['cheque_amount'];
			$bank_flow_detail['type']='Money In';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}		
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_receipt_transaction where receipt_date>='$cdate1' and receipt_date<='$cdate2' and generated_user_id='$session_dist_ver' and source in ('Web','Admin') and payment_mode in ('Online','Wallet') AND bank_id='$bankid'");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_in_amount=$money_in_amount+$fetch_receipt['total_amount'];
			$partydetail=$source_value='';
			if($fetch_receipt['transaction_id']>0)
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_party_transaction, tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_id='".$fetch_receipt['transaction_id']."' and tbl_party.distributor_id='$session_dist_ver'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
					$source_value='Credit Receipt';
				}
			}
			else
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_party where party_id='".$fetch_receipt['party_id']."' and distributor_id='$session_dist_ver'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
					$source_value='Outstanding Credit Receipt';
				}
			}		
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_receipt['receipt_date']));
			$bank_flow_detail['Party_Name']=$partydetail;
			$bank_flow_detail['Bill_No']=$fetch_receipt['txn_receipt_id'];
			$bank_flow_detail['Source']=$source_value;
			$bank_flow_detail['Amount']=$fetch_receipt['total_amount'];
			$bank_flow_detail['type']='Money In';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}		
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id =tbl_party.party_id and tbl_other_receipt_txn.receipt_date>='$cdate1' and tbl_other_receipt_txn.receipt_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source in ('Web','Admin') and  tbl_other_receipt_txn.bank_id='$bankid'");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_in_amount=$money_in_amount+$fetch_receipt['cheque_amount'];
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_receipt['receipt_date']));
			$bank_flow_detail['Party_Name']=$fetch_receipt['party_name'].' - '.$fetch_receipt['party_phone'];
			$bank_flow_detail['Bill_No']=$fetch_receipt['user_receipt_id'];
			$bank_flow_detail['Source']='Payment In';
			$bank_flow_detail['Amount']=$fetch_receipt['cheque_amount'];
			$bank_flow_detail['type']='Money In';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}
	
	$cash_other_2=mysqli_query($con,"SELECT *,tbl_other_cash_txn_master_detail.remark as final_rmk FROM tbl_other_cash_txn_master_detail,tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id = tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date>='$cdate1' and tbl_other_cash_txn_master_detail.receipt_date<='$cdate2' and tbl_other_cash_txn_master_detail.status='Complete' and tbl_other_cash_txn_master_detail.bank_id='$bankid' and  tbl_other_cash_txn_master.distributor_id='$session_dist_ver' and tbl_other_cash_txn_master.txn_type='To Receive'");
	if(mysqli_num_rows($cash_other_2)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_2))
		{
			$money_in_amount=$money_in_amount+$fetch_other['total_amount'];
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_other['receipt_date']));
			$bank_flow_detail['Party_Name']=$fetch_other['retailer_detail'];
			$bank_flow_detail['Bill_No']=$fetch_other['final_rmk'];
			$bank_flow_detail['Source']='Receiable';
			$bank_flow_detail['Amount']=$fetch_other['total_amount'];
			$bank_flow_detail['type']='Money In';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}
	
	
	$money_out_amount=0;
	$cash_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_transfer where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Complete'");
	if(mysqli_num_rows($cash_bank)>0)
	{  
		while($fetch_bank=mysqli_fetch_assoc($cash_bank))
		{
			if($fetch_bank['txn_type']=="Deposite" and $fetch_bank['bank_contra_id']==$bankid)
			{
				$money_out_amount=$money_out_amount+$fetch_bank['transfer_amt'];
				$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
				$bank_flow_detail['Party_Name']=$fetch_bank['remark'];
				$bank_flow_detail['Bill_No']=$fetch_bank['transaction_id'];
				$bank_flow_detail['Source']='Withdrawal';
				$bank_flow_detail['Amount']=$fetch_bank['transfer_amt'];
				$bank_flow_detail['type']='Money Out';
				$response['bank_flow_detail'][]=$bank_flow_detail;
			}
			else if(($fetch_bank['txn_type']=="Withdrawal" || $fetch_bank['txn_type']=="Cheque Withdrawal" || $fetch_bank['txn_type']=="Cheque Bounce" || $fetch_bank['txn_type']=="Other Tax Paid") and $fetch_bank['bank_id']==$bankid)
			{
				$money_out_amount=$money_out_amount+$fetch_bank['withdrawal_amt'];
				$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
				$bank_flow_detail['Party_Name']=$fetch_bank['remark'];
				$bank_flow_detail['Bill_No']=$fetch_bank['transaction_id'];
				$bank_flow_detail['Source']='Withdrawal';
				$bank_flow_detail['Amount']=$fetch_bank['withdrawal_amt'];
				$bank_flow_detail['type']='Money Out';
				$response['bank_flow_detail'][]=$bank_flow_detail;
			}
		}
	}
	$cash_expense=mysqli_query($con,"SELECT *,tbl_distributor_expenses_master.insert_date as ins_date FROM tbl_distributor_expenses_master,tbl_expense_head where tbl_distributor_expenses_master.head_id=tbl_expense_head.head_id and tbl_distributor_expenses_master.insert_date>='$cdate1' and tbl_distributor_expenses_master.insert_date<='$cdate2' and tbl_distributor_expenses_master.distributor_id='$session_dist_ver' and tbl_distributor_expenses_master.status in ('Complete','Active') and tbl_distributor_expenses_master.payment_mode like '%Bank%' AND bank_id='$bankid'");
	if(mysqli_num_rows($cash_expense)>0)
	{  
		while($fetch_expense=mysqli_fetch_assoc($cash_expense))
		{
			$money_out_amount=$money_out_amount+$fetch_expense['bank_amt'];
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_expense['ins_date']));
			$bank_flow_detail['Party_Name']=$fetch_expense['remark']. "(".$fetch_expense['expense_head_name'].")";
			$bank_flow_detail['Bill_No']=$fetch_expense['bill_no'];
			$bank_flow_detail['Source']='Expense';
			$bank_flow_detail['Amount']=$fetch_expense['bank_amt'];
			$bank_flow_detail['type']='Money Out';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}
	$purchase_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_purchase_party, tbl_distributor_transaction_charges where tbl_distributor_transaction.unique_bill = tbl_distributor_transaction_charges.unique_bill and tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.transaction_date>='$cdate1' and tbl_distributor_transaction.transaction_date<='$cdate2' and tbl_distributor_transaction.txn_type = 'Add' and tbl_distributor_transaction.payment_status='Complete' and tbl_distributor_transaction.distributor_id ='$session_dist_ver' and tbl_distributor_transaction.bank_id='$bankid' group by tbl_distributor_transaction.unique_bill, tbl_distributor_transaction.bill_no");
	if(mysqli_num_rows($purchase_detail)>0)
	{  
		while($fetch_purchase=mysqli_fetch_assoc($purchase_detail))
		{
			$money_out_amount=$money_out_amount+$fetch_purchase['net_amt'];
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_purchase['transaction_date']));
			$bank_flow_detail['Party_Name']=$fetch_purchase['party_name'];
			$bank_flow_detail['Bill_No']=$fetch_purchase['bill_no'];
			$bank_flow_detail['Source']='Purchase';
			$bank_flow_detail['Amount']=$fetch_purchase['net_amt'];
			$bank_flow_detail['type']='Money Out';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_purchase_payment_transaction where payment_date>='$cdate1' and payment_date<='$cdate2' and distributor_id='$session_dist_ver' and payment_mode='Online' and bank_id='$bankid'");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_out_amount=$money_out_amount+$fetch_receipt['total_amount'];
			$partydetail=$source_value='';
			if($fetch_receipt['unique_bill']!='')
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_distributor_transaction,tbl_purchase_party where tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.unique_bill ='".$fetch_receipt['unique_bill']."' and tbl_purchase_party.distributor_id='$session_dist_ver' and tbl_distributor_transaction.bill_no='".$fetch_receipt['bill_no']."'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
					$source_value='Credit Receipt';
				}
			}
			else
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_purchase_party where purchase_party_id='".$fetch_receipt['party_id']."' and distributor_id='$session_dist_ver'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
					$source_value='Outstanding Credit Receipt';
				}
			}
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_receipt['payment_date']));
			$bank_flow_detail['Party_Name']=$partydetail;
			$bank_flow_detail['Bill_No']=$fetch_receipt['bill_no'];
			$bank_flow_detail['Source']=$source_value;
			$bank_flow_detail['Amount']=$fetch_receipt['total_amount'];
			$bank_flow_detail['type']='Money Out';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}	
	$cash_other_4=mysqli_query($con,"SELECT *,tbl_other_cash_txn_master_detail.remark as final_rmk FROM tbl_other_cash_txn_master_detail,tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id =tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date>='$cdate1' and tbl_other_cash_txn_master_detail.receipt_date<='$cdate2' and tbl_other_cash_txn_master_detail.status='Complete' and tbl_other_cash_txn_master_detail.bank_id='$bankid' and tbl_other_cash_txn_master.distributor_id='$session_dist_ver' and tbl_other_cash_txn_master.txn_type!='To Receive'");
	if(mysqli_num_rows($cash_other_2)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_2))
		{
			$money_out_amount=$money_out_amount+$fetch_other['total_amount'];
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_other['payment_date']));
			$bank_flow_detail['Party_Name']=$fetch_other['retailer_detail'];
			$bank_flow_detail['Bill_No']=$fetch_other['final_rmk'];
			$bank_flow_detail['Source']='Payable';
			$bank_flow_detail['Amount']=$fetch_other['total_amount'];
			$bank_flow_detail['type']='Money Out';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}
	
	$advance_receipt_detail = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail,tbl_purchase_party where tbl_purchase_advance_txn_detail.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_advance_txn_detail.distributor_id='$session_dist_ver' and tbl_purchase_advance_txn_detail.status = 'Complete' and tbl_purchase_advance_txn_detail.payment_mode='Online' and tbl_purchase_advance_txn_detail.bank_id='$bankid' and tbl_purchase_advance_txn_detail.receipt_date>='$cdate1' and tbl_purchase_advance_txn_detail.receipt_date<='$cdate2'");
	if(mysqli_num_rows($advance_receipt_detail)>0)
	{  
		while($fetch_pur_data=mysqli_fetch_assoc($advance_receipt_detail))
		{
			$money_out_amount=$money_out_amount+$fetch_pur_data['total_amount'];
			$bank_flow_detail['date']=date("d-M-Y", strtotime($fetch_pur_data['receipt_date']));
			$bank_flow_detail['Party_Name']=$fetch_pur_data['party_name'].' - '.$fetch_pur_data['party_phone'];
			$bank_flow_detail['Bill_No']=$fetch_pur_data['remark'];
			$bank_flow_detail['Source']='Payment Out';
			$bank_flow_detail['Amount']=$fetch_pur_data['total_amount'];
			$bank_flow_detail['type']='Money Out';
			$response['bank_flow_detail'][]=$bank_flow_detail;
		}
	}
	
	$response['total_money_in_amount']=strval ($money_in_amount);
	$response['total_money_out_amount']=strval ($money_out_amount);
	$tamt_closing=0;
	$closing=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_bank_collection WHERE date<='$cdate2' and distributor_id='$session_dist_ver' AND bank_id='$bankid' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		$tamt_closing=$fetch_closing['closing_amt'];
	}
	$response['closing_amount']=strval ($tamt_closing);
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