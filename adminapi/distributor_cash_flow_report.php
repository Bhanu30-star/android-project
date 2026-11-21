<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['start_date'];
	$cdate2=$_POST['end_date'];

	$tamt_opening=0;
	$closing=mysqli_query($con,"SELECT closing_amt,date,opening_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$session_dist_ver' AND date<='$cdate1' order by date desc limit 1");
	$fetch_closing=mysqli_fetch_array($closing);
	if(mysqli_num_rows($closing)>0)
	{
		if($fetch_closing['date']==$cdate1)
			$tamt_opening=$fetch_closing['opening_amt'];
		else
			$tamt_opening=$fetch_closing['closing_amt'];
	}
	$response['opening_amount']=strval ($tamt_opening);
	
	$cash_flow_detail=array();
	$money_in_amount=0;
	$cash_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_transfer where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Complete' and bank_contra_id='0' and txn_type='Withdrawal'");
	if(mysqli_num_rows($cash_bank)>0)
	{  
		while($fetch_bank=mysqli_fetch_assoc($cash_bank))
		{
			$money_in_amount=$money_in_amount+$fetch_bank['withdrawal_amt'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
			$cash_flow_detail['Party_Name']=$fetch_bank['remark'];
			$cash_flow_detail['Bill_No']=$fetch_bank['transaction_id'];
			$cash_flow_detail['Source']='Withdrawal';
			$cash_flow_detail['Amount']=$fetch_bank['withdrawal_amt'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	$dsr_detail=mysqli_query($con,"select * from tbl_dsr,tbl_user where tbl_dsr.user_id = tbl_user.user_id and tbl_dsr.dsr_status= 'Accept' and tbl_dsr.tb_insertdate >='$cdate1' and tbl_dsr.tb_insertdate <='$cdate2' and tbl_user.distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($dsr_detail)>0)
	{  
		while($fetch_dsr=mysqli_fetch_assoc($dsr_detail))
		{
			$money_in_amount=$money_in_amount+$fetch_dsr['cash_detail'];
			$cash_flow_detail['user_id']=$fetch_dsr['user_id'];
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_dsr['tb_insertdate']));
			$cash_flow_detail['Party_Name']=$fetch_dsr['user_name'];
			$cash_flow_detail['Bill_No']='';
			$cash_flow_detail['Source']='DSR';
			$cash_flow_detail['Amount']=$fetch_dsr['cash_detail'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	$sale_detail = mysqli_query($con,"select * from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to =tbl_party.party_id and tbl_party_transaction.payment_status= 'Complete' and tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type!='Receipt' and tbl_party_transaction.source in ('Admin','Web') and tbl_party_transaction.payment_mode in ('Cash','Both')");
	if(mysqli_num_rows($sale_detail)>0)
	{  
		while($fetch_sale=mysqli_fetch_assoc($sale_detail))
		{
			$money_in_amount=$money_in_amount+$fetch_sale['cash_amount'];	
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_sale['transaction_date']));
			$cash_flow_detail['Party_Name']=$fetch_sale['party_name'].' - '.$fetch_sale['party_phone'];
			$cash_flow_detail['Bill_No']=$fetch_sale['transaction_bill_number'];
			$cash_flow_detail['Source']='Sale';
			$cash_flow_detail['Amount']=$fetch_sale['cash_amount'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}		
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_receipt_transaction where receipt_date>='$cdate1' and receipt_date<='$cdate2' and generated_user_id='$session_dist_ver' and source in ('Web','Admin') and payment_mode in ('Cash','Both')");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_in_amount=$money_in_amount+$fetch_receipt['cash_amount'];
			$cash_flow_detail['user_id']='';
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
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_receipt['receipt_date']));
			$cash_flow_detail['Party_Name']=$partydetail;
			$cash_flow_detail['Bill_No']=$fetch_receipt['txn_receipt_id'];
			$cash_flow_detail['Source']=$source_value;
			$cash_flow_detail['Amount']=$fetch_receipt['cash_amount'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}		
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id =tbl_party.party_id and tbl_other_receipt_txn.receipt_date>='$cdate1' and tbl_other_receipt_txn.receipt_date<='$cdate2' and tbl_party.distributor_id='$session_dist_ver' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source in ('Web','Admin') and tbl_other_receipt_txn.payment_mode in ('Cash','Both')");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_in_amount=$money_in_amount+$fetch_receipt['cash_amount'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_receipt['receipt_date']));
			$cash_flow_detail['Party_Name']=$fetch_receipt['party_name'].' - '.$fetch_receipt['party_phone'];
			$cash_flow_detail['Bill_No']=$fetch_receipt['user_receipt_id'];
			$cash_flow_detail['Source']='Payment In';
			$cash_flow_detail['Amount']=$fetch_receipt['cash_amount'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	
	$cash_other_1=mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Complete' and txn_type!='To Receive'");
	if(mysqli_num_rows($cash_other_1)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_1))
		{
			$money_in_amount=$money_in_amount+$fetch_other['txn_amount'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_other['insert_date']));
			$cash_flow_detail['Party_Name']=$fetch_other['retailer_detail'];
			$cash_flow_detail['Bill_No']=$fetch_other['remark'];
			$cash_flow_detail['Source']='Receiable';
			$cash_flow_detail['Amount']=$fetch_other['txn_amount'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	$cash_other_2=mysqli_query($con,"SELECT *,tbl_other_cash_txn_master_detail.remark as final_rmk FROM tbl_other_cash_txn_master_detail, tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id =tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date>='$cdate1' and tbl_other_cash_txn_master_detail.receipt_date<='$cdate2' and tbl_other_cash_txn_master_detail.status='Complete' and tbl_other_cash_txn_master_detail.payment_mode='Cash' and tbl_other_cash_txn_master_detail.bank_id='0' and tbl_other_cash_txn_master.distributor_id='$session_dist_ver' and tbl_other_cash_txn_master.txn_type = 'To Receive'");
	if(mysqli_num_rows($cash_other_2)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_2))
		{
			$money_in_amount=$money_in_amount+$fetch_other['total_amount'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_other['receipt_date']));
			$cash_flow_detail['Party_Name']=$fetch_other['retailer_detail'];
			$cash_flow_detail['Bill_No']=$fetch_other['final_rmk'];
			$cash_flow_detail['Source']='Receiable';
			$cash_flow_detail['Amount']=$fetch_other['total_amount'];
			$cash_flow_detail['type']='Money In';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	
	
	$money_out_amount=0;
	$cash_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_transfer where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Complete' and bank_contra_id='0' and txn_type='Deposite'");
	if(mysqli_num_rows($cash_bank)>0)
	{  
		while($fetch_bank=mysqli_fetch_assoc($cash_bank))
		{
			$money_out_amount=$money_out_amount+$fetch_bank['transfer_amt'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
			$cash_flow_detail['Party_Name']=$fetch_bank['remark'];
			$cash_flow_detail['Bill_No']=$fetch_bank['transaction_id'];
			$cash_flow_detail['Source']='Deposit';
			$cash_flow_detail['Amount']=$fetch_bank['transfer_amt'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	$cash_expense=mysqli_query($con,"SELECT *,tbl_distributor_expenses_master.insert_date as ins_date FROM tbl_distributor_expenses_master,tbl_expense_head where tbl_distributor_expenses_master.head_id=tbl_expense_head.head_id and tbl_distributor_expenses_master.insert_date>='$cdate1' and tbl_distributor_expenses_master.insert_date<='$cdate2' and tbl_distributor_expenses_master.distributor_id='$session_dist_ver' and tbl_distributor_expenses_master.status in ('Complete','Active') and tbl_distributor_expenses_master.payment_mode='Cash'");
	if(mysqli_num_rows($cash_expense)>0)
	{  
		while($fetch_expense=mysqli_fetch_assoc($cash_expense))
		{
			$money_out_amount=$money_out_amount+$fetch_expense['cash_amt'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_expense['ins_date']));
			$cash_flow_detail['Party_Name']=$fetch_expense['remark']. "(".$fetch_expense['expense_head_name'].")";
			$cash_flow_detail['Bill_No']=$fetch_expense['bill_no'];
			$cash_flow_detail['Source']='Expense';
			$cash_flow_detail['Amount']=$fetch_expense['cash_amt'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	$purchase_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_purchase_party, tbl_distributor_transaction_charges where tbl_distributor_transaction.unique_bill = tbl_distributor_transaction_charges.unique_bill and tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.transaction_date>='$cdate1' and tbl_distributor_transaction.transaction_date<='$cdate2' and tbl_distributor_transaction.txn_type = 'Add' and tbl_distributor_transaction.payment_mode='Cash' and tbl_distributor_transaction.payment_status='Complete' and tbl_distributor_transaction.distributor_id ='$session_dist_ver' group by tbl_distributor_transaction.unique_bill, tbl_distributor_transaction.bill_no");
	if(mysqli_num_rows($purchase_detail)>0)
	{  
		while($fetch_purchase=mysqli_fetch_assoc($purchase_detail))
		{
			$money_out_amount=$money_out_amount+$fetch_purchase['net_amt'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_purchase['transaction_date']));
			$cash_flow_detail['Party_Name']=$fetch_purchase['party_name'];
			$cash_flow_detail['Bill_No']=$fetch_purchase['bill_no'];
			$cash_flow_detail['Source']='Purchase';
			$cash_flow_detail['Amount']=$fetch_purchase['net_amt'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_purchase_payment_transaction where payment_date>='$cdate1' and payment_date<='$cdate2' and distributor_id='$session_dist_ver' and payment_mode='Cash'");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_out_amount=$money_out_amount+$fetch_receipt['total_amount'];
			$cash_flow_detail['user_id']='';
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
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_receipt['payment_date']));
			$cash_flow_detail['Party_Name']=$partydetail;
			$cash_flow_detail['Bill_No']=$fetch_receipt['bill_no'];
			$cash_flow_detail['Source']=$source_value;
			$cash_flow_detail['Amount']=$fetch_receipt['total_amount'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}	
	
	$cash_other_3=mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master where insert_date>='$cdate1' and insert_date<='$cdate2' and distributor_id='$session_dist_ver' and status='Complete' and txn_type='To Receive'");
	if(mysqli_num_rows($cash_other_3)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_3))
		{
			$money_out_amount=$money_out_amount+$fetch_other['txn_amount'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_other['insert_date']));
			$cash_flow_detail['Party_Name']=$fetch_other['retailer_detail'];
			$cash_flow_detail['Bill_No']=$fetch_other['remark'];
			$cash_flow_detail['Source']='Payable';
			$cash_flow_detail['Amount']=$fetch_other['txn_amount'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	
	$cash_other_4=mysqli_query($con,"SELECT *,tbl_other_cash_txn_master_detail.remark as final_rmk FROM tbl_other_cash_txn_master_detail, tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id =tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date>='$cdate1' and tbl_other_cash_txn_master_detail.receipt_date<='$cdate2' and tbl_other_cash_txn_master_detail.status='Complete' and tbl_other_cash_txn_master_detail.payment_mode='Cash' and tbl_other_cash_txn_master_detail.bank_id='0' and tbl_other_cash_txn_master.distributor_id='$session_dist_ver' and tbl_other_cash_txn_master.txn_type!='To Receive'");
	if(mysqli_num_rows($cash_other_4)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_4))
		{
			$money_out_amount=$money_out_amount+$fetch_other['total_amount'];
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_other['receipt_date']));
			$cash_flow_detail['Party_Name']=$fetch_other['retailer_detail'];
			$cash_flow_detail['Bill_No']=$fetch_other['final_rmk'];
			$cash_flow_detail['Source']='Payable';
			$cash_flow_detail['Amount']=$fetch_other['total_amount'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	
	$advance_receipt_detail = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail,tbl_purchase_party where tbl_purchase_advance_txn_detail.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_advance_txn_detail.distributor_id='$session_dist_ver' and tbl_purchase_advance_txn_detail.status = 'Complete' and tbl_purchase_advance_txn_detail.payment_mode='Cash' and  tbl_purchase_advance_txn_detail.receipt_date>='$cdate1' and tbl_purchase_advance_txn_detail.receipt_date<='$cdate2'");
	if(mysqli_num_rows($advance_receipt_detail)>0)
	{  
		while($fetch_pur_data=mysqli_fetch_assoc($advance_receipt_detail))
		{
			$money_out_amount=$money_out_amount+$fetch_pur_data['total_amount'];
			
			$cash_flow_detail['user_id']='';
			$cash_flow_detail['date']=date("d-M-Y", strtotime($fetch_pur_data['receipt_date']));
			$cash_flow_detail['Party_Name']=$fetch_pur_data['party_name'].' - '.$fetch_pur_data['party_phone'];
			$cash_flow_detail['Bill_No']=$fetch_pur_data['remark'];
			$cash_flow_detail['Source']='Payment Out';
			$cash_flow_detail['Amount']=$fetch_pur_data['total_amount'];
			$cash_flow_detail['type']='Money Out';
			$response['cash_flow_detail'][]=$cash_flow_detail;
		}
	}
	
	$response['total_money_in_amount']=strval ($money_in_amount);
	$response['total_money_out_amount']=strval ($money_out_amount);
	$tamt_closing=0;
	$closing=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$session_dist_ver' AND date<='$cdate2' order by date desc limit 1");
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