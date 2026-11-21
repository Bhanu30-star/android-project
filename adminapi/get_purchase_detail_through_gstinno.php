<?php
include("../../connect.php");
$response = array();
if(isset($_POST['searchdate1']) && isset($_POST['searchdate2']) && isset($_POST['gstinno']) && isset($_POST['distributor_id']))
{
	
	$cbillno=$_POST['billno'];
	$cdate1=$_POST['searchdate1'];
	$cdate2=$_POST['searchdate2'];
	$gstinno = $_POST['gstinno'];
	$session_dist_ver = $_POST['distributor_id'];
	
	$select_user=mysqli_query($con,"SELECT distributor_id FROM tbl_distributor where distributor_id='$session_dist_ver' and gstin_no='$gstinno'");
	if(mysqli_num_rows($select_user)>0)
	{     
		$queryres = "SELECT * FROM tbl_party_transaction,tbl_party WHERE tbl_party_transaction.transaction_to=tbl_party.party_id AND  tbl_party_transaction.transaction_date>='$cdate1' AND tbl_party_transaction.transaction_date<='$cdate2' AND tbl_party_transaction.party_gstin='$gstinno' and tbl_party_transaction.party_gstin!='' AND tbl_party_transaction.bill_type IN ('Tax Invoice','Receipt','Payout') AND tbl_party_transaction.generated_by!='Distributor'";
		if($cbillno!="")
		{
			$queryres=$queryres." "."AND tbl_party_transaction.transaction_bill_number LIKE '".$cbillno."%'";
		}
		$queryres=$queryres." "."ORDER BY tbl_party_transaction.transaction_bill_number DESC";
		$res = mysqli_query($con,$queryres);
		$billbook=array();
		$bill_sum_amount=0;
		if(mysqli_num_rows($res)>0)
		{     
			while($fetch_product=mysqli_fetch_assoc($res))
			{
				$txn_id=$fetch_product['transaction_id'];
				$ver=$fetch_product['distributor_id'];
				$billbook['transaction_id']=$fetch_product['transaction_id'];
				$billbook['invoice_number']=$fetch_product['transaction_bill_number'];
				$billbook['transaction_date']=$fetch_product['transaction_date'];
				$billbook['transaction_time']=$fetch_product['transaction_time'];
				$billbook['party_name']=$fetch_product['party_name'];
				$billbook['party_phone']=$fetch_product['party_phone'];
				$billbook['total_amount']=$fetch_product['total_amount'];
				$billbook['discount_amount']=$fetch_product['disc_amt'];
				$billbook['discount_on_total']=$fetch_product['discount_on_total'];
				$billbook['payment_status']=$fetch_product['payment_status'];
				$billbook['cess_amount']=$fetch_product['cess_amount'];
				$billbook['tcs_percentage']=$fetch_product['tcs_percentage'];
				$billbook['labour_charges']=$fetch_product['labour_charges'];
				$billbook['freight_charges']=$fetch_product['freight_charges'];
				$billbook['other_expenses']=$fetch_product['other_expenses'];
				$billbook['final_amount']=$fetch_product['final_amt'];
				$billbook['payment_mode']=$fetch_product['payment_mode'];
				$billbook['cash_amount']=$fetch_product['cash_amount'];
				$billbook['cheque_amount']=$fetch_product['cheque_amount'];
				$billbook['bill_editable']=$fetch_product['bill_editable'];
				$billbook['bill_type']=$fetch_product['bill_type'];
				$billbook['source']=$fetch_product['source'];
				$billbook['txn_service_type']=$fetch_product['txn_service_type'];
				$billbook['gst_configure']=$fetch_product['gst_configure'];
				$billbook['serial_no_bill']=$fetch_product['serial_no_bill'];
				$billbook['bank_name']=$fetch_product['bank_name'];
				$billbook['cheque_no']=$fetch_product['cheque_no'];
				$billbook['cheque_date']=$fetch_product['cheque_date'];
				$bill_sum_amount=$bill_sum_amount+$fetch_product['final_amt'];
				$billbook['billbook_detail']=array();
				$check_product_type='';
				$res_test_product = mysqli_query($con,"select *,tbl_party_transaction_detail.product_price as actualprice from tbl_party_transaction_detail,tbl_product where tbl_party_transaction_detail.product_id = tbl_product.product_id and tbl_party_transaction_detail.transaction_id='$txn_id' order by tbl_party_transaction_detail.transaction_detail_id asc");  
				while($fetch_product_val=mysqli_fetch_assoc($res_test_product))
				{
					$check_product_type=$fetch_product_val['product_type'];
					$billbook_detail['transaction_detail_id']=$fetch_product_val['transaction_detail_id'];
					$billbook_detail['transaction_id']=$fetch_product_val['transaction_id'];
					$billbook_detail['product_id']=$fetch_product_val['product_id'];
					$billbook_detail['product_name']=$fetch_product_val['product_name'];
					$billbook_detail['product_price']=$fetch_product_val['actualprice'];
					$billbook_detail['actual_quantity']=$fetch_product_val['stock_quantity'];
					$billbook_detail['product_price_inc']=$fetch_product_val['product_price'];
					$billbook_detail['product_price_exc']=$fetch_product_val['product_price_exc'];
					$billbook_detail['quantity']=$fetch_product_val['quantity'];
					$billbook_detail['product_disc']=$fetch_product_val['product_disc'];
					$billbook_detail['product_total_amt']=$fetch_product_val['product_total_amt'];
					$billbook_detail['IMEI_NO']=$fetch_product_val['IMEI_NO'];	
					$billbook_detail['CGST_amount']=$fetch_product_val['CGST_amount'];
					$billbook_detail['SGST_amount']=$fetch_product_val['SGST_amount'];
					$billbook_detail['IGST_amount']=$fetch_product_val['IGST_amount'];	
					$billbook_detail['gst_perc']=$fetch_product_val['gst_perc'];
					$billbook_detail['cess_final_amt']=$fetch_product_val['cess_final_amt'];
					$billbook_detail['cess_percentage']=$fetch_product_val['cess_percentage'];
					$billbook_detail['product_type']=$fetch_product_val['product_type'];
					$billbook_detail['cess_app']=$fetch_product_val['cess_applicable'];
					$billbook_detail['tcs_tds_applicable']=$fetch_product_val['tcs_tds_applicable'];
					$billbook_detail['serial_type']=$fetch_product_val['serial_type'];
					$billbook_detail['data_type']=$fetch_product_val['data_type'];
					$billbook_detail['hsn_code']=$fetch_product_val['hsn_code'];
					$billbook_detail['bag_type']=$fetch_product_val['bag_type'];
					$billbook_detail['bag_qty']=$fetch_product_val['bag_qty'];
					$billbook_detail['sale_unit']=$fetch_product_val['sale_unit'];
					$billbook_detail['maintain_inventory']=$fetch_product_val['maintain_inventory'];
					$billbook_detail['primary_unit']=$fetch_product_val['unit'];
					$billbook_detail['secondary_unit']=$fetch_product_val['secondary_unit'];
					
					$res_conversiondetail=mysqli_query($con,"SELECT total_unit FROM tbl_product_conversion_unit WHERE product_id='".$fetch_product_val['product_id']."' and status='Active' and primary_value ='Yes'");
					if(mysqli_num_rows($res_conversiondetail)>0)
					{
						while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
						{
							$billbook_detail['primary_total_unit']= $fetch_consume['total_unit'];
						}
					}
					else
					{
						$billbook_detail['primary_total_unit']= '0';
					}
					
					
					$billbook['billbook_detail'][]=$billbook_detail;
				}
				
				if($fetch_product['bill_type']=="Receipt")
				{
					$billbook['receipt_call']="download_receipt_invoice.php?id=".$fetch_product['transaction_id']."&user_id=".$ver;
				}
				else if($fetch_product['serial_no_bill']=="Yes")
				{
					$billbook['receipt_call']="download_serialno_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				}
				else if($check_product_type=="FMCG")
				{
					$billbook['receipt_call']="download-cess-receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				} 
				else
				{
					$billbook['receipt_call']="download_receipt.php?id=".$fetch_product['transaction_id']."&user_id=".$ver."&lng=eng";
				}
				
				
				$response['billbook'][]=$billbook;
			}
			
			$response['total_bill_amount']=$bill_sum_amount;
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
		$response['details']="Distributor detail is not valid!!";
	}
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>