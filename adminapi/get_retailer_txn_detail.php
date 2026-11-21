<?php
include("../../connect.php");
$response = array();
if(isset($_POST['cdate1']) && isset($_POST['cdate2']) &&  isset($_POST['distributor_id']))
{
	$cdate1=$_POST['cdate1'];
	$cdate2=$_POST['cdate2'];
	$temp_string=explode("-",$cdate1);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate1=date("Y-m-d",$temp_date2);
	
	$temp_string=explode("-",$cdate2);
	$temp_string2=(string)$temp_string[1];
	$temp_string3=(string)$temp_string[2];
	if(strlen($temp_string2)==1)
	{
		$temp_string2="0".$temp_string2;
	}
	if(strlen($temp_string3)==1)
	{
		$temp_string3="0".$temp_string3;
	}
	$temp_data_date=$temp_string[0]."-".$temp_string2."-".$temp_string3;
	$temp_date2=strtotime($temp_data_date);
	$cdate2=date("Y-m-d",$temp_date2);
	
	$cFOS = isset($_POST['user_id']) ? $_POST['user_id'] : '';
	$cparty = isset($_POST['party_id']) ? $_POST['party_id'] : '';
	$ver = $_POST['distributor_id'];
	$distributor_einv='No';
	$check_author1 = mysqli_query($con,"select fabrics_receipt,einvoice_applicable from tbl_distributor where distributor_id='$ver'");
	while($fetch_dis=mysqli_fetch_assoc($check_author1))
	{
		$bill_type_dis=$fetch_dis['fabrics_receipt'];
		if($fetch_dis['einvoice_applicable']=="Yes")
			$distributor_einv='Yes';
	}
	
	$flagfinal=0;
	$queryres = "select *,tbl_party_transaction.source as finalbillsource from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and  tbl_party_transaction.transaction_date>='$cdate1' and tbl_party_transaction.transaction_date<='$cdate2' and tbl_user.distributor_id='$ver'";
	if($cparty!="")
	{
		$queryres=$queryres." "."and tbl_party.party_id='$cparty'";
	}
	if($cFOS!="")
	{
		$queryres=$queryres." "."and tbl_user.user_id='$cFOS'";
	}
	$queryres=$queryres." "."order by tbl_party_transaction.id DESC";
	$res = mysqli_query($con,$queryres);
	$billbook=array();
	if(mysqli_num_rows($res)>0)
	{     
		$flagfinal=1;
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			$transaction_id=$fetch_product['transaction_id'];
			$billbook['einvoice_process']='No';
			if($distributor_einv=='Yes')
			{
				$res_einvoice=mysqli_query($con,"select * from tbl_party_einvoice where invoice_id='$transaction_id' and status IN ('Complete','Pending')");
				$res_ein1=mysqli_query($con,"select * from tbl_party_einvoice_generation_process where transaction_id='$transaction_id'");
				if(mysqli_num_rows($res_einvoice)>0 || mysqli_num_rows($res_ein1)>0)
					$billbook['einvoice_process']='Yes';
			}
			$billbook['transaction_id']=$fetch_product['transaction_id'];
			$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
			$billbook['transaction_date']=$fetch_product['transaction_date'];
			$billbook['transaction_time']=$fetch_product['transaction_time'];
			$billbook['party_name']=$fetch_product['party_name'];
			$billbook['party_phone']=$fetch_product['party_phone'];
			$billbook['party_gstin']=$fetch_product['party_gstin'];
			$billbook['fos_name']=$fetch_product['user_name']."-".$fetch_product['user_phone'];
			$billbook['total_amount']=$fetch_product['total_amount'];
			$billbook['discount_amount']=$fetch_product['disc_amt'];
			$billbook['final_amount']=$fetch_product['final_amt'];
			$billbook['payment_mode']=$fetch_product['payment_mode'];
			$billbook['cash_amount']=$fetch_product['cash_amount'];
			$billbook['cheque_amount']=$fetch_product['cheque_amount'];
			$billbook['bill_type']=$fetch_product['bill_type'];
			$billbook['payment_status']=$fetch_product['payment_status'];
			$billbook['source']=$fetch_product['finalbillsource'];
			$billbook['txn_service_type']=$fetch_product['txn_service_type'];
			$billbook['bill_editable']=$fetch_product['bill_editable'];
			$billbook['bill_editmove']=$fetch_product['bill_editmove'];
			
			$billbook['message_txn_id']=$fetch_product['message_txn_id'];
			$billbook['message_date']=$fetch_product['bill_date'];
			if($fetch_product['message_txn_id']!='')
			{
				$res_message_1 = mysqli_query($con,"select * from tbl_autofill_retailer_message_detail where transaction_id='".$fetch_product['message_txn_id']."' and distributor_id='$ver' order by message_id desc limit 1");  
				if(mysqli_num_rows($res_message_1)>0)
				{	
					while($fetch_date=mysqli_fetch_assoc($res_message_1))
					{
						$billbook['message_date']=$fetch_date['message_date'];
					}
				}
				else
				{
					$res_message_2 = mysqli_query($con,"select * from tbl_retailer_message_detail where transaction_id='".$fetch_product['message_txn_id']."' and user_id='".$fetch_product['transaction_from']."' order by message_id desc limit 1");  
					if(mysqli_num_rows($res_message_2)>0)
					{	
						while($fetch_date=mysqli_fetch_assoc($res_message_2))
						{
							$billbook['message_date']=$fetch_date['message_date'];
						}
					}
				}
			}
			
			$billbook['serial_no_bill']=$fetch_product['serial_no_bill'];
			$billbook['gst_configure']=$fetch_product['gst_configure'];
			$check_product_type='';
			$res_test_product = mysqli_query($con,"select * from  tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id=tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id' order by tbl_party_transaction_detail.transaction_detail_id asc limit 1");    
			while($fetch_test_product=mysqli_fetch_assoc($res_test_product))
			{
				$check_product_type=$fetch_test_product['product_type'];
			}
			$billbook['product_bill_type']=$check_product_type;
			
			if($fetch_product['bill_type']=="Receipt")
			{
				$billbook['receipt_call']="download_receipt_invoice.php?id=".$fetch_product['transaction_id']."&user_id=".$ver;
			}
			else if($fetch_product['serial_no_bill']=="Yes")
			{
				$billbook['receipt_call']="download_serialno_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				$billbook['receipt_call_hindi']="download_serialno_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=hnd";
			}
			else if($check_product_type=="FMCG")
			{
				$billbook['receipt_call']="download-cess-receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				$billbook['receipt_call_hindi']="download-cess-receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=hnd";
			} 
			else if($bill_type_dis=='Yes')
			{ 
				$billbook['receipt_call']="download_receipt_fabrics.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				$billbook['receipt_call_hindi']="download_receipt_fabrics.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=hnd";
			}
			else
			{
				$billbook['receipt_call']="download_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				$billbook['receipt_call_hindi']="download_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=hnd";
			}
			
			
			
			$billbook['bill_product_detail']=array();
			$proidval=$fetch_product['product_id'];
			$res_consumedetail = mysqli_query($con,"select * from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id'"); 
			if(mysqli_num_rows($res_consumedetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
				{
					$bill_product_detail['product_id']=$fetch_consume['product_id'];
					$bill_product_detail['free_flag']= $fetch_consume['free_flag'];
					$bill_product_detail['pname']= $fetch_consume['product_name'];
					$bill_product_detail['quantity']=$fetch_consume['quantity'];
					$bill_product_detail['sale_unit']= $fetch_consume['sale_unit'];
					$bill_product_detail['pro_bag_type']= $fetch_consume['bag_type'];
					$bill_product_detail['pro_bagqty']=$fetch_consume['bag_qty'];
					$bill_product_detail['pro_price']= $fetch_consume['product_price'];
					$bill_product_detail['cgst_amt']=$fetch_consume['CGST_amount'];
					$bill_product_detail['sgst_amt']= $fetch_consume['SGST_amount'];
					$bill_product_detail['igst_amt']=$fetch_consume['IGST_amount'];
					$bill_product_detail['pur_total_amt']=$fetch_consume['product_total_amt'];
					$bill_product_detail['serial']='';
					$billbook['bill_product_detail'][]=$bill_product_detail;
				}
			}
			else
			{
				$billbook['bill_product_detail']=$bill_product_detail;
			}
			
			
			
			
			
			
			$response['billbook'][]=$billbook;
		}
	}
	
	$res_credit="select tbl_receipt_transaction.receipt_id,tbl_receipt_transaction.txn_receipt_id,tbl_receipt_transaction.receipt_date,tbl_receipt_transaction.receipt_time,tbl_receipt_transaction.total_amount,tbl_receipt_transaction.cash_amount,tbl_receipt_transaction.cheque_amount,tbl_receipt_transaction.payment_mode,tbl_party.party_name,tbl_party.party_phone,tbl_party_transaction.transaction_id,tbl_user.user_name,tbl_user.user_phone  from tbl_receipt_transaction,tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to=tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_receipt_transaction.transaction_id=tbl_party_transaction.transaction_id and tbl_receipt_transaction.receipt_date>='$cdate1' and tbl_receipt_transaction.receipt_date<='$cdate2' and tbl_receipt_transaction.status='Complete' and tbl_user.distributor_id='$ver'";
	if($cparty!="")
	{
		$res_credit=$res_credit." "."and tbl_party.party_id='$cparty'";
	}
	if($cFOS!="")
	{
		$res_credit=$res_credit." "."and tbl_user.user_id='$cFOS'";
	}
	$res_credit1 = mysqli_query($con,$res_credit);
	$receiptbook=array();
	if(mysqli_num_rows($res_credit1)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res_credit1))
		{
			$flagfinal=1;
			$receiptbook['transaction_id']=$fetch_product['transaction_id'];
			$receiptbook['party_name']=$fetch_product['party_name'];
			$receiptbook['party_phone']=$fetch_product['party_phone'];
			$receiptbook['fos_name']=$fetch_product['user_name']."-".$fetch_product['user_phone'];
			$receiptbook['receipt_id']=$fetch_product['receipt_id'];
			$receiptbook['txn_receipt_id']=$fetch_product['txn_receipt_id'];
			$receiptbook['receipt_date']=$fetch_product['receipt_date'];
			$receiptbook['receipt_time']=$fetch_product['receipt_time'];
			$receiptbook['total_amount']=$fetch_product['total_amount'];
			$receiptbook['cash_amount']=$fetch_product['cash_amount'];
			$receiptbook['cheque_amount']=$fetch_product['cheque_amount'];
			$receiptbook['payment_mode']=$fetch_product['payment_mode'];
			$receiptbook['receipt_call']="download_cash_receipt.php?id=".$fetch_product['receipt_id']."&user_id=".$ver;
			$response['receiptbook'][]=$receiptbook;
		}
	}

	
	$res_other = "select * from tbl_other_receipt_txn,tbl_user,tbl_party where tbl_other_receipt_txn.user_id=tbl_user.user_id and  tbl_other_receipt_txn.party_id=tbl_party.party_id and tbl_other_receipt_txn.receipt_date>='$cdate1' and tbl_other_receipt_txn.receipt_date<='$cdate2' and tbl_other_receipt_txn.status='Complete' and tbl_user.distributor_id='$ver'";
	if($cparty!="")
	{
		$res_other=$res_other." "."and tbl_party.party_id='$cparty'";
	}
	if($cFOS!="")
	{
		$res_other=$res_other." "."and tbl_user.user_id='$cFOS'";
	}
	$res_other=$res_other." "."order by tbl_other_receipt_txn.receipt_txn_id DESC";
	$res_other1 = mysqli_query($con,$res_other);
	$otherreceipt=array();
	if(mysqli_num_rows($res_other1)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res_other1))
		{
			$flagfinal=1;
			$otherreceipt['receipt_txn_id']=$fetch_product['receipt_txn_id'];
			$otherreceipt['receipt_no']=$fetch_product['user_receipt_id'];
			$otherreceipt['party_name']=$fetch_product['party_name'];
			$otherreceipt['party_phone']=$fetch_product['party_phone'];
			$otherreceipt['fos_name']=$fetch_product['user_name']."-".$fetch_product['user_phone'];
			$otherreceipt['receipt_date']=$fetch_product['receipt_date'];
			
			$otherreceipt['receipt_type']=$fetch_product['receipt_type'];
			$otherreceipt['receipt_date']=$fetch_product['receipt_date'];
			$otherreceipt['receipt_time']=$fetch_product['receipt_time'];
			$otherreceipt['total_amount']=$fetch_product['total_amount'];
			$otherreceipt['cash_amount']=$fetch_product['cash_amount'];
			$otherreceipt['cheque_amount']=$fetch_product['cheque_amount'];
			$otherreceipt['payment_mode']=$fetch_product['payment_mode'];
			$otherreceipt['receipt_call']="download_other_receipt_invoice.php?id=".base64_encode($fetch_product['receipt_txn_id'])."&user_id=".base64_encode($ver);
			$response['otherreceipt'][]=$otherreceipt;
		}
	}	
	if($flagfinal==1)
	{		
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['message']="Bill not available";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>