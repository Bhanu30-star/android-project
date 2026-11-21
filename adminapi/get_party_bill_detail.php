<?php
include("../../connect.php");
$response = array();
if(isset($_POST['user_id']) && isset($_POST['party_id']) && isset($_POST['distributor_user_id']))
{
	$userid=$_POST['user_id'];
	$partyid=$_POST['party_id'];
	$last_date=$_POST['searchdate1'];
	$end_date=$_POST['searchdate2'];
	$dis_uid = $_POST['distributor_user_id'];

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
	
	$distributor_einv='No';
	$check_author1 = mysqli_query($con,"select einvoice_applicable from tbl_distributor where distributor_id in (select distributor_id from tbl_user where user_id='$userid')");
	while($fetch_dis=mysqli_fetch_assoc($check_author1))
	{
		if($fetch_dis['einvoice_applicable']=="Yes")
			$distributor_einv='Yes';
	}
	
	$flagfinal=0;
	$res = mysqli_query($con,"select *,tbl_party_transaction.source as billsourceval from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_user.user_id='$userid' and tbl_party.party_id='$partyid' and tbl_party_transaction.transaction_date>='$last_date' and tbl_party_transaction.transaction_date<='$end_date' and tbl_party_transaction.generated_by!='Distributor' order by tbl_party_transaction.id DESC");
	$billbook=array();
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$bill_txn_id=$fetch_product['transaction_id'];
			$billbook['einvoice_process']='No';
			if($distributor_einv=='Yes')
			{
				$res_einvoice=mysqli_query($con,"select * from tbl_party_einvoice where invoice_id='$bill_txn_id' and status IN ('Complete','Pending')");
				$res_ein1=mysqli_query($con,"select * from tbl_party_einvoice_generation_process where transaction_id='$bill_txn_id'");
				if(mysqli_num_rows($res_einvoice)>0 || mysqli_num_rows($res_ein1)>0)
					$billbook['einvoice_process']='Yes';
			}
			$res_test_product = mysqli_query($con,"select * from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$bill_txn_id' order by tbl_party_transaction_detail.transaction_detail_id asc limit 1");    
			while($fetch_test_product=mysqli_fetch_assoc($res_test_product))
			{
				$check_product_type=$fetch_test_product['product_type'];
			}
			$billbook['product_bill_type']=$check_product_type;
			if($fetch_product['payment_mode']=="Credit")
			{
				if($fetch_product['payment_status']=='Pending')
				{
					$flagfinal=1;
					$billbook['transaction_id']=$fetch_product['transaction_id'];
					$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
					$billbook['transaction_date']=$fetch_product['transaction_date'];
					$billbook['transaction_time']=$fetch_product['transaction_time'];
					$billbook['party_name']=$fetch_product['party_name'];
					$billbook['party_phone']=$fetch_product['party_phone'];
					$billbook['fos_name']=$fetch_product['user_name'];
					$billbook['total_amount']=$fetch_product['total_amount'];
					$billbook['discount_amount']=$fetch_product['disc_amt'];
					$billbook['final_amount']=$fetch_product['final_amt'];
					$billbook['payment_mode']=$fetch_product['payment_mode'];
					$billbook['cash_amount']=$fetch_product['cash_amount'];
					$billbook['cheque_amount']=$fetch_product['cheque_amount'];
					$billbook['bill_editable']=$fetch_product['bill_editable'];
					$billbook['bill_type']=$fetch_product['bill_type'];
					$billbook['source']=$fetch_product['billsourceval'];
					$billbook['txn_service_type']=$fetch_product['txn_service_type'];
					$billbook['gst_configure']=$fetch_product['gst_configure'];
					$response['billbook'][]=$billbook;
				}
			}
			else
			{
				$flagfinal=1;
				$billbook['transaction_id']=$fetch_product['transaction_id'];
				$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
				$billbook['transaction_date']=$fetch_product['transaction_date'];
				$billbook['transaction_time']=$fetch_product['transaction_time'];
				$billbook['party_name']=$fetch_product['party_name'];
				$billbook['party_phone']=$fetch_product['party_phone'];
				$billbook['fos_name']=$fetch_product['user_name'];
				$billbook['total_amount']=$fetch_product['total_amount'];
				$billbook['discount_amount']=$fetch_product['disc_amt'];
				$billbook['final_amount']=$fetch_product['final_amt'];
				$billbook['payment_mode']=$fetch_product['payment_mode'];
				$billbook['cash_amount']=$fetch_product['cash_amount'];
				$billbook['cheque_amount']=$fetch_product['cheque_amount'];
				$billbook['bill_type']=$fetch_product['bill_type'];
				$billbook['bill_editable']=$fetch_product['bill_editable'];
				$billbook['source']=$fetch_product['billsourceval'];
				$billbook['txn_service_type']=$fetch_product['txn_service_type'];
				$billbook['gst_configure']=$fetch_product['gst_configure'];
				$response['billbook'][]=$billbook;
			}
		}
	}

	$res_credit = mysqli_query($con,"select * from tbl_party_transaction,tbl_user,tbl_party where tbl_party_transaction.transaction_from = tbl_user.user_id and  tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_user.user_id='$userid' and tbl_party.party_id='$partyid' and tbl_party_transaction.cash_receipt_date>='$last_date' and tbl_party_transaction.cash_receipt_date <='$end_date' and tbl_party_transaction.payment_mode='Credit' order by tbl_party_transaction.id DESC");
	$receiptbook=array();
	if(mysqli_num_rows($res_credit)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res_credit))
		{
			$receiptbook['transaction_id']=$fetch_product['transaction_id'];
			$receiptbook['party_name']=$fetch_product['party_name'];
			$receiptbook['party_phone']=$fetch_product['party_phone'];
			$receiptbook['fos_name']=$fetch_product['user_name'];
			$temp_transaction=$fetch_product['transaction_id'];
			$res_txn = mysqli_query($con,"select receipt_id,txn_receipt_id,receipt_date,receipt_time,total_amount,cash_amount,cheque_amount,payment_mode  from tbl_receipt_transaction where transaction_id='$temp_transaction' and receipt_date>='$last_date' and receipt_date<='$end_date' and status='Complete'");
			while($fetch_product2=mysqli_fetch_assoc($res_txn))
			{
				$flagfinal=1;
				$receiptbook['receipt_id']=$fetch_product2['receipt_id'];
				$receiptbook['txn_receipt_id']=$fetch_product2['txn_receipt_id'];
				$receiptbook['receipt_date']=$fetch_product2['receipt_date'];
				$receiptbook['receipt_time']=$fetch_product2['receipt_time'];
				$receiptbook['total_amount']=$fetch_product2['total_amount'];
				$receiptbook['cash_amount']=$fetch_product2['cash_amount'];
				$receiptbook['cheque_amount']=$fetch_product2['cheque_amount'];
				$receiptbook['payment_mode']=$fetch_product2['payment_mode'];
				$response['receiptbook'][]=$receiptbook;
			}
		}
	}

	
	$res_other = mysqli_query($con,"select * from tbl_other_receipt_txn,tbl_user,tbl_party where tbl_other_receipt_txn.user_id=tbl_user.user_id and  tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_user.user_id='$userid' and tbl_party.party_id='$partyid' and tbl_other_receipt_txn.receipt_date>='$last_date' and tbl_other_receipt_txn.receipt_date<='$end_date' and tbl_other_receipt_txn.status='Complete' order by tbl_other_receipt_txn.receipt_txn_id DESC");
	$otherreceipt=array();
	if(mysqli_num_rows($res_other)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res_other))
		{
			$flagfinal=1;
			$otherreceipt['receipt_txn_id']=$fetch_product['receipt_txn_id'];
			$otherreceipt['receipt_no']=$fetch_product['user_receipt_id'];
			$otherreceipt['party_name']=$fetch_product['party_name'];
			$otherreceipt['party_phone']=$fetch_product['party_phone'];
			$otherreceipt['fos_name']=$fetch_product['user_name'];
			$otherreceipt['receipt_date']=$fetch_product['receipt_date'];
			$otherreceipt['receipt_type']=$fetch_product['receipt_type'];
			$otherreceipt['receipt_date']=$fetch_product['receipt_date'];
			$otherreceipt['receipt_time']=$fetch_product['receipt_time'];
			$otherreceipt['total_amount']=$fetch_product['total_amount'];
			$otherreceipt['cash_amount']=$fetch_product['cash_amount'];
			$otherreceipt['cheque_amount']=$fetch_product['cheque_amount'];
			$otherreceipt['payment_mode']=$fetch_product['payment_mode'];
			$otherreceipt['adjust_amount']=$fetch_product['adjust_amount'];
			$otherreceipt['source']=$fetch_product['source'];
			$response['otherreceipt'][]=$otherreceipt;
		}
	}	
	if($flagfinal==1)
	{		
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="No transaction bill is available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>