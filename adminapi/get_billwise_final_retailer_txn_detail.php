<?php
include("../../connect.php");
$response = array();
if(isset($_POST['transaction_id']) && isset($_POST['distributor_user_id']) &&  isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	date_default_timezone_set('Asia/Calcutta');
	$clientIP = $_SERVER['REMOTE_ADDR'];
	$apiUrl = "http://ipinfo.io/{$clientIP}/json";
	$response1 = file_get_contents($apiUrl);
	$details = json_decode($response1, true);
	if($details['country']=='AE')
	{
		date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d");
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
	
	$txnid=$_POST['transaction_id'];
	$ver = $_POST['distributor_id'];
	
	
	$flagfinal=0;
	
	$queryres = "select *,tbl_party_transaction.source as finalbillsource from tbl_party_transaction,tbl_party,tbl_user where tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party_transaction.transaction_from=tbl_user.user_id and tbl_party_transaction.transaction_id='$txnid' and tbl_user.distributor_id='$ver'";
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
				{
					$billbook['einvoice_process']='Yes';
					if(mysqli_num_rows($res_einvoice)>0)
					{
						$fetch_product2=mysqli_fetch_assoc($res_einvoice);
						if($fetch_product2['Irn']!='') 
						{ 
							$billbook['einvoice_url']="download-einvoice-pdf.php?txnid=".base64_encode($fetch_product2['transaction_id'])."&distid=".base64_encode($fetch_product['distributor_id']);
						}
						else
						{
							$billbook['einvoice_url']='';
						}
					}
				}
				else
				{
					$billbook['einvoice_url']='';
				}
				
			}
			else
			{
				$billbook['einvoice_url']='';
			}
			
			$billbook['dsr_flag']='No';
			$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='".$fetch_product['transaction_from']."' and date='$da' and dsr_status='Accept'");
			if(mysqli_num_rows($res_dsr)>0 && $fetch_product['transaction_date']==$da)
			{
				$billbook['dsr_flag']='Yes';
			}
			
			$billbook['transaction_id']=$fetch_product['transaction_id'];
			$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
			$billbook['transaction_date']=$fetch_product['transaction_date'];
			$billbook['transaction_time']=$fetch_product['transaction_time'];
			$billbook['party_id']=$fetch_product['party_id'];
			$billbook['party_name']=$fetch_product['party_name'];
			$billbook['party_phone']=$fetch_product['party_phone'];
			$billbook['party_gstin']=$fetch_product['party_gstin'];
			$billbook['place_supply']=$fetch_product['place_of_supply'];
			$billbook['party_code']=$fetch_product['party_code'];
			$billbook['party_address']=$fetch_product['party_address'];
			$billbook['fos_id']=$fetch_product['user_id'];
			$billbook['fos_name']=$fetch_product['user_name']."-".$fetch_product['user_phone'];
			$billbook['total_amount']=$fetch_product['total_amount'];
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
			$billbook['remark']=$fetch_product['remark'];
			$billbook['gst_configure']=$fetch_product['gst_configure'];
			$billbook['round_off_amt']=$fetch_product['round_off_amt'];
			$billbook['disc_amt']=$fetch_product['disc_amt'];
			$billbook['discount_on_total']=$fetch_product['discount_on_total'];
			$billbook['tcs_amount']=$fetch_product['tcs_amount'];
			$billbook['labour_charges']=$fetch_product['labour_charges'];
			$billbook['freight_charges']=$fetch_product['freight_charges'];
			$billbook['other_expenses']=$fetch_product['other_expenses'];
			$billbook['credit_days']=$fetch_product['credit_days'];
			$billbook['bank_id']=$fetch_product['bank_id'];
			$billbook['bank_name']=$fetch_product['bank_name'];
			$billbook['cheque_no']=$fetch_product['cheque_no'];
			$billbook['cheque_date']=$fetch_product['cheque_date'];
			$billbook['serial_no_bill']=$fetch_product['serial_no_bill'];
			$billbook['cess_amount']=$fetch_product['cess_amount'];
			
			$billbook['credit_payment_received']=0;
			if($fetch_product['payment_mode']=="Credit" && $fetch_product['cash_amount']>0)
			{
				$billbook['credit_payment_received']=1;
			}
			
			
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
			$res_consumedetail = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as pro_price from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$transaction_id'"); 
			if(mysqli_num_rows($res_consumedetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
				{
					$bill_product_detail['product_id']=$fetch_consume['product_id'];
					$bill_product_detail['free_flag']= $fetch_consume['free_flag'];
					$bill_product_detail['product_name']= $fetch_consume['product_name'];
					$bill_product_detail['quantity']=$fetch_consume['quantity'];
					$bill_product_detail['sale_unit']= $fetch_consume['sale_unit'];
					$bill_product_detail['pro_bag_type']= $fetch_consume['bag_type'];
					$bill_product_detail['pro_bagqty']=$fetch_consume['bag_qty'];
					$bill_product_detail['product_price']= $fetch_consume['pro_price'];
					$bill_product_detail['cgst_amt']=$fetch_consume['CGST_amount'];
					$bill_product_detail['sgst_amt']= $fetch_consume['SGST_amount'];
					$bill_product_detail['igst_amt']=$fetch_consume['IGST_amount'];
					$bill_product_detail['pur_total_amt']=$fetch_consume['product_total_amt'];
					$bill_product_detail['IMEI_NO']=$fetch_consume['IMEI_NO'];
					$bill_product_detail['product_disc']=$fetch_consume['product_disc'];
					$bill_product_detail['cess_final_amt']=$fetch_consume['cess_final_amt'];
					$bill_product_detail['gst_perc']=$fetch_consume['gst_perc'];
					$bill_product_detail['taxable_amount']=$fetch_consume['taxable_amount'];
					$bill_product_detail['pro_price']=$fetch_consume['actualprice'];
					$bill_product_detail['transaction_detail_id']=$fetch_consume['transaction_detail_id'];
					$bill_product_detail['transaction_id']=$fetch_consume['transaction_id'];
					$bill_product_detail['actual_quantity']=$fetch_consume['stock_quantity'];
					$bill_product_detail['product_price_inc']=$fetch_consume['product_price'];
					$bill_product_detail['product_price_exc']=$fetch_consume['product_price_exc'];
					$bill_product_detail['cess_percentage']=$fetch_consume['cess_percentage'];
					$bill_product_detail['product_type']=$fetch_consume['product_type'];
					$bill_product_detail['cess_app']=$fetch_consume['cess_applicable'];
					$bill_product_detail['tcs_tds_applicable']=$fetch_consume['tcs_tds_applicable'];
					$bill_product_detail['serial_type']=$fetch_consume['serial_type'];
					$bill_product_detail['data_type']=$fetch_consume['data_type'];
					$bill_product_detail['hsn_code']=$fetch_consume['hsn_code'];
					$bill_product_detail['maintain_inventory']=$fetch_consume['maintain_inventory'];
					$bill_product_detail['primary_unit']=$fetch_consume['unit'];
					$bill_product_detail['secondary_unit']=$fetch_consume['secondary_unit'];
				
					$res_conversiondetail=mysqli_query($con,"SELECT total_unit FROM tbl_product_conversion_unit WHERE product_id='".$fetch_consume['product_id']."' and status='Active' and primary_value ='Yes'");
					if(mysqli_num_rows($res_conversiondetail)>0)
					{
						while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
						{
							$bill_product_detail['primary_total_unit']= $fetch_consume['total_unit'];
						}
					}
					else
					{
						$bill_product_detail['primary_total_unit']= '0';
					}
					
					
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