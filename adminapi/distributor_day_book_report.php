<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['start_date']))
{
	$session_dist_ver = $_POST['distributor_id'];
	$cdate1=$_POST['start_date'];
	$money_in_amount=$money_out_amount=$total_inout_amt=0;
	$day_detail=array();
	$cash_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_transfer where insert_date='$cdate1' and distributor_id='$session_dist_ver' and status='Complete' and bank_contra_id='0' and txn_type='Withdrawal'");
	if(mysqli_num_rows($cash_bank)>0)
	{  
		while($fetch_bank=mysqli_fetch_assoc($cash_bank))
		{
			$money_in_amount=$money_in_amount+$fetch_bank['withdrawal_amt'];
			$total_inout_amt=$total_inout_amt+$fetch_bank['withdrawal_amt'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
			$day_detail['Party_Name']= $fetch_bank['remark'];
			$day_detail['Source']='Withdrawal';
			$day_detail['Amount']=$fetch_bank['withdrawal_amt'];
			$day_detail['money_in']=$fetch_bank['withdrawal_amt'];
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}
	$dsr_detail=mysqli_query($con,"select * from tbl_dsr,tbl_user where tbl_dsr.user_id = tbl_user.user_id and tbl_dsr.dsr_status= 'Accept' and tbl_dsr.tb_insertdate ='$cdate1' and tbl_user.distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($dsr_detail)>0)
	{  
		while($fetch_dsr=mysqli_fetch_assoc($dsr_detail))
		{
			$money_in_amount=$money_in_amount+$fetch_dsr['cash_detail'];
			$total_inout_amt=$total_inout_amt+$fetch_dsr['cash_detail'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_dsr['tb_insertdate']));
			$day_detail['Party_Name']= $fetch_dsr['user_name'];
			$day_detail['Source']='DSR';
			$day_detail['Amount']=$fetch_dsr['cash_detail'];
			$day_detail['money_in']=$fetch_dsr['cash_detail'];
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}
	$sale_detail = mysqli_query($con,"select * from tbl_party_transaction,tbl_party where tbl_party_transaction.transaction_to =tbl_party.party_id and tbl_party_transaction.transaction_date='$cdate1' and tbl_party.distributor_id='$session_dist_ver' and tbl_party_transaction.bill_type!= 'Receipt' and tbl_party_transaction.source in ('Admin','Web')");
	if(mysqli_num_rows($sale_detail)>0)
	{  
		while($fetch_sale=mysqli_fetch_assoc($sale_detail))
		{
			$total_inout_amt=$total_inout_amt+$fetch_sale['final_amt'];
			if($fetch_sale['payment_mode']!='Credit')
				$money_in_amount=$money_in_amount+$fetch_sale['final_amt'];	
			$day_detail['date']=date("d-M-Y", strtotime($fetch_sale['transaction_date']));
			$day_detail['Party_Name']=$fetch_sale['party_name'].' - '.$fetch_sale['party_phone'];
			$day_detail['Source']='Sale';
			$day_detail['Amount']=$fetch_sale['final_amt'];
			if($fetch_sale['payment_mode']!='Credit')
				$day_detail['money_in']=$fetch_sale['final_amt'];
			else
				$day_detail['money_in']='';
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}		
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_receipt_transaction where receipt_date='$cdate1' and generated_user_id='$session_dist_ver' and source in ('Web','Admin')");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_in_amount=$money_in_amount+$fetch_receipt['total_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_receipt['total_amount'];
			$partydetail=$source_value='';
			if($fetch_receipt['transaction_id']>0)
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_party_transaction, tbl_party where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_id='".$fetch_receipt['transaction_id']."' and tbl_party.distributor_id='$session_dist_ver'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
				}
			}
			else
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_party where party_id='".$fetch_receipt['party_id']."' and distributor_id='$session_dist_ver'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
				}
			}		
			$day_detail['date']=date("d-M-Y", strtotime($fetch_receipt['receipt_date']));
			$day_detail['Party_Name']=$partydetail;
			$day_detail['Source']='Payment In';
			$day_detail['Amount']=$fetch_receipt['cash_amount'];
			$day_detail['money_in']=$fetch_receipt['cash_amount'];
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}		
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_other_receipt_txn,tbl_party where tbl_other_receipt_txn.party_id =tbl_party.party_id and tbl_other_receipt_txn.receipt_date='$cdate1' and tbl_party.distributor_id='$session_dist_ver' and tbl_other_receipt_txn.status='Complete' and tbl_other_receipt_txn.source in ('Web','Admin')");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_in_amount=$money_in_amount+$fetch_receipt['total_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_receipt['total_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_receipt['receipt_date']));
			$day_detail['Party_Name']=$fetch_receipt['party_name'].' - '.$fetch_receipt['party_phone'];
			$day_detail['Source']='Advance Receipt';
			$day_detail['Amount']=$fetch_receipt['total_amount'];
			$day_detail['money_in']=$fetch_receipt['total_amount'];
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}
	
	$cash_other_1=mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master where insert_date='$cdate1' and distributor_id='$session_dist_ver' and status='Complete' and txn_type!='To Receive'");
	if(mysqli_num_rows($cash_other_1)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_1))
		{
			$money_in_amount=$money_in_amount+$fetch_other['txn_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_other['txn_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_other['insert_date']));
			$day_detail['Party_Name']=$fetch_other['retailer_detail'];
			$day_detail['Source']='Payment In';
			$day_detail['Amount']=$fetch_other['txn_amount'];
			$day_detail['money_in']=$fetch_other['txn_amount'];
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}
	$cash_other_2=mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master_detail, tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id= tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date='$cdate1' and tbl_other_cash_txn_master_detail.status='Complete' and tbl_other_cash_txn_master.distributor_id= '$session_dist_ver' and tbl_other_cash_txn_master.txn_type='To Receive'");
	if(mysqli_num_rows($cash_other_2)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_2))
		{
			$money_in_amount=$money_in_amount+$fetch_other['total_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_other['total_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_other['receipt_date']));
			$day_detail['Party_Name']=$fetch_other['retailer_detail'];
			$day_detail['Source']='Payment In';
			$day_detail['Amount']=$fetch_other['total_amount'];
			$day_detail['money_in']=$fetch_other['total_amount'];
			$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}
	
	$cash_bank=mysqli_query($con,"SELECT * FROM tbl_distributor_bank_transfer where insert_date='$cdate1' and distributor_id='$session_dist_ver' and status='Complete' and bank_contra_id='0' and txn_type='Deposite'");
	if(mysqli_num_rows($cash_bank)>0)
	{  
		while($fetch_bank=mysqli_fetch_assoc($cash_bank))
		{
			$money_out_amount=$money_out_amount+$fetch_bank['transfer_amt'];
			$total_inout_amt=$total_inout_amt+$fetch_bank['transfer_amt'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_bank['insert_date']));
			$day_detail['Party_Name']=$fetch_bank['remark'];
			$day_detail['Source']='Deposit';
			$day_detail['Amount']=$fetch_bank['transfer_amt'];
			$day_detail['money_in']='';
			$day_detail['money_out']=$fetch_bank['transfer_amt'];
			$response['day_detail'][]=$day_detail;
		}
	}
	$cash_expense=mysqli_query($con,"SELECT *,tbl_distributor_expenses_master.insert_date as ins_date FROM tbl_distributor_expenses_master,tbl_expense_head where tbl_distributor_expenses_master.head_id=tbl_expense_head.head_id and tbl_distributor_expenses_master.insert_date='$cdate1' and tbl_distributor_expenses_master.distributor_id='$session_dist_ver' and tbl_distributor_expenses_master.status in ('Complete','Active')");
	if(mysqli_num_rows($cash_expense)>0)
	{  
		while($fetch_expense=mysqli_fetch_assoc($cash_expense))
		{
			$money_out_amount=$money_out_amount+$fetch_expense['final_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_expense['final_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_expense['ins_date']));
			$day_detail['Party_Name']=$fetch_expense['remark']. "(".$fetch_expense['expense_head_name'].")";
			$day_detail['Source']='Expense';
			$day_detail['Amount']=$fetch_expense['final_amount'];
			$day_detail['money_in']='';
			$day_detail['money_out']=$fetch_expense['final_amount'];
			$response['day_detail'][]=$day_detail;
		}
	}
	$purchase_detail=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_purchase_party, tbl_distributor_transaction_charges where tbl_distributor_transaction.unique_bill = tbl_distributor_transaction_charges.unique_bill and tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.bill_date='$cdate1' and tbl_distributor_transaction.txn_type='Add' and tbl_distributor_transaction.distributor_id ='$session_dist_ver' group by tbl_distributor_transaction.unique_bill, tbl_distributor_transaction.bill_no");
	if(mysqli_num_rows($purchase_detail)>0)
	{  
		while($fetch_purchase=mysqli_fetch_assoc($purchase_detail))
		{
			$total_inout_amt=$total_inout_amt+$fetch_purchase['net_amt'];
			if($fetch_purchase['payment_mode']!='Credit')
				$money_out_amount=$money_out_amount+$fetch_purchase['net_amt'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_purchase['transaction_date']));
			$day_detail['Party_Name']=$fetch_purchase['party_name'];
			$day_detail['Source']='Purchase';
			$day_detail['Amount']=$fetch_purchase['net_amt'];
			$day_detail['money_in']='';
			if($fetch_purchase['payment_mode']!='Credit')
				$day_detail['money_out']=$fetch_purchase['net_amt'];
			else
				$day_detail['money_out']='';
			$response['day_detail'][]=$day_detail;
		}
	}
	$res_receipt=mysqli_query($con,"SELECT * FROM tbl_purchase_payment_transaction where payment_date='$cdate1' and distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($res_receipt)>0)
	{  
		while($fetch_receipt=mysqli_fetch_assoc($res_receipt))
		{
			$money_out_amount=$money_out_amount+$fetch_receipt['total_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_receipt['total_amount'];
			$partydetail=$source_value='';
			if($fetch_receipt['unique_bill']!='')
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_distributor_transaction,tbl_purchase_party where tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.unique_bill='".$fetch_receipt['unique_bill']."' and tbl_purchase_party.distributor_id='$session_dist_ver' and tbl_distributor_transaction.bill_no='".$fetch_receipt['bill_no']."'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
				}
			}
			else
			{
				$resparty = mysqli_query($con,"select party_name,party_phone from tbl_purchase_party where purchase_party_id='".$fetch_receipt['party_id']."' and distributor_id='$session_dist_ver'");
				while($fetch_party=mysqli_fetch_assoc($resparty))
				{
					$partydetail=$fetch_party['party_name'].'-'.$fetch_party['party_phone'];
				}
			}
			$day_detail['date']=date("d-M-Y", strtotime($fetch_receipt['payment_date']));
			$day_detail['Party_Name']=$partydetail;
			$day_detail['Source']='Payment Out';
			$day_detail['Amount']=$fetch_receipt['total_amount'];
			$day_detail['money_in']='';
			$day_detail['money_out']=$fetch_receipt['total_amount'];
			$response['day_detail'][]=$day_detail;
		}
	}	
	
	$cash_other_3=mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master where insert_date='$cdate1' and distributor_id='$session_dist_ver' and status='Complete' and txn_type='To Receive'");
	if(mysqli_num_rows($cash_other_3)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_3))
		{
			$money_out_amount=$money_out_amount+$fetch_other['txn_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_other['txn_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_other['insert_date']));
			$day_detail['Party_Name']=$fetch_other['retailer_detail'];
			$day_detail['Source']='Payment Out';
			$day_detail['Amount']=$fetch_other['txn_amount'];
			$day_detail['money_in']='';
			$day_detail['money_out']=$fetch_other['txn_amount'];
			$response['day_detail'][]=$day_detail;
		}
	}
	
	$cash_other_4=mysqli_query($con,"SELECT * FROM tbl_other_cash_txn_master_detail, tbl_other_cash_txn_master where tbl_other_cash_txn_master_detail.transaction_id = tbl_other_cash_txn_master.transaction_id and tbl_other_cash_txn_master_detail.receipt_date='$cdate1' and tbl_other_cash_txn_master_detail.status='Complete' and tbl_other_cash_txn_master_detail.bank_id ='0' and tbl_other_cash_txn_master.distributor_id='$session_dist_ver' and tbl_other_cash_txn_master.txn_type!='To Receive'");
	if(mysqli_num_rows($cash_other_4)>0)
	{  
		while($fetch_other=mysqli_fetch_assoc($cash_other_4))
		{
			$money_out_amount=$money_out_amount+$fetch_other['total_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_other['total_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_other['receipt_date']));
			$day_detail['Party_Name']=$fetch_other['retailer_detail'];
			$day_detail['Source']='Payment Out';
			$day_detail['Amount']=$fetch_other['total_amount'];
			$day_detail['money_in']='';
			$day_detail['money_out']=$fetch_other['total_amount'];
			$response['day_detail'][]=$day_detail;
		}
	}
	
	$advance_receipt_detail = mysqli_query($con,"select * from tbl_purchase_advance_txn_detail, tbl_purchase_party where tbl_purchase_advance_txn_detail.party_id = tbl_purchase_party.purchase_party_id and tbl_purchase_advance_txn_detail.distributor_id='$session_dist_ver' and tbl_purchase_advance_txn_detail.status='Complete' and tbl_purchase_advance_txn_detail.receipt_date='$cdate1'");
	if(mysqli_num_rows($advance_receipt_detail)>0)
	{  
		while($fetch_pur_data=mysqli_fetch_assoc($advance_receipt_detail))
		{
			$money_out_amount=$money_out_amount+$fetch_pur_data['total_amount'];
			$total_inout_amt=$total_inout_amt+$fetch_pur_data['total_amount'];
			$day_detail['date']=date("d-M-Y", strtotime($fetch_pur_data['receipt_date']));
			$day_detail['Party_Name']=$fetch_pur_data['party_name'].' - '.$fetch_pur_data['party_phone'];
			$day_detail['Source']='Advance Purchase';
			$day_detail['Amount']=$fetch_pur_data['total_amount'];
			$day_detail['money_in']='';
			$day_detail['money_out']=$fetch_pur_data['total_amount'];
			$response['day_detail'][]=$day_detail;
		}
	}
	$response['total_amount']=strval ($total_inout_amt);
	$response['total_money_in_amount']=strval ($money_in_amount);
	$response['total_money_out_amount']=strval ($money_out_amount);
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