<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{


	$dis_id = $_POST['distributor_id'];
	$sdate = $_POST['start_date'];
	$edate = $_POST['end_date'];
	date_default_timezone_set('Asia/Calcutta');
	$product=array();
	if($dis_id>0)
	{
		$select_product = mysqli_query($con,"select *,tbl_bill_generation_process_support.status as processstatus from tbl_bill_generation_process_support,tbl_party where tbl_bill_generation_process_support.party_id=tbl_party.party_id and tbl_bill_generation_process_support.status in ('Pending','Complete') and tbl_bill_generation_process_support.distributor_id='$dis_id' and tbl_bill_generation_process_support.bill_date>='$sdate' and tbl_bill_generation_process_support.bill_date<='$edate' group by tbl_bill_generation_process_support.request_id");
	}
	else
	{
		$select_product=mysqli_query($con,"select *,tbl_bill_generation_process_support.status as processstatus from tbl_bill_generation_process_support,tbl_party where tbl_bill_generation_process_support.party_id=tbl_party.party_id and tbl_bill_generation_process_support.status in ('Pending','Complete') and tbl_bill_generation_process_support.bill_date>='$sdate' and tbl_bill_generation_process_support.bill_date<='$edate' group by tbl_bill_generation_process_support.request_id");
	}
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$product['request_id']=$fetch_product['request_id'];
			$product['party_name']=$fetch_product['party_name'];
			$product['bill_date']=$fetch_product['bill_date'];
			$product['payment_mode']=$fetch_product['payment_mode'];
			$product['tax_type']=$fetch_product['tax_type'];
			$product['status']=$fetch_product['processstatus'];
			if($fetch_product['processstatus']=='Complete')
			{
				$fetch_bill = mysqli_query($con,"select transaction_id  FROM `tbl_party_transaction` where transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id') and message_txn_id='".$fetch_product['request_id']."'");
				$fetch_bill_req=mysqli_fetch_array($fetch_bill);
				$product['url'] = "download_invoice_pdf.php?id=" . $fetch_bill_req['transaction_id'] . "&user_id=" . $dis_id . "&lng=eng";
				
				$check_dist = mysqli_query($con,"select * from tbl_distributor where distributor_id='$dis_id' and einvoice_applicable='Yes'");
				if(mysqli_num_rows($check_dist)>0 && $fetch_bill_req['party_gstin']!='')
				{ 
					$extra_link1 = 'tbl_party_einvoice';
					$fetch_bill_einvoice=mysqli_query($con,"select * FROM `tbl_party_einvoice` where invoice_id='".$fetch_bill_req['transaction_id']."' and `distributor_id`='$dis_id' and sttaus='Complete' and Irn!=''");
					if(mysqli_num_rows($fetch_bill_einvoice)>0)
					{
						$fetch_product2=mysqli_fetch_array($fetch_bill_einvoice);
						$product['einvoice_url'] ="download-einvoice-pdf.php?txnid=".base64_encode($fetch_product2['transaction_id'])."&distid=".base64_encode($dis_id)."&datautable=".base64_encode($extra_link1);
					}
					else
					{
						$product['einvoice_url'] = '';
					}
				}
				else
				{
					$product['einvoice_url'] = '';
				}
			}
			else
			{
				$product['url'] = '';
				$product['einvoice_url'] = '';
			}
			
			
			
			$item_detail=array();
			$product['item_detail']=array();
			$proidval=$fetch_product['request_id'];
			$res_consumedetail=mysqli_query($con,"SELECT * FROM tbl_bill_generation_process_support,tbl_product WHERE tbl_bill_generation_process_support.product_id = tbl_product.product_id and tbl_bill_generation_process_support.request_id='$proidval'");
			if(mysqli_num_rows($res_consumedetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
				{
					$item_detail['id']=$fetch_consume['id'];
					$item_detail['product_name']= $fetch_consume['product_name'];
					$item_detail['amount']= $fetch_consume['amount'];
					$product['item_detail'][]=$item_detail;
				}
			}
			else
			{
				$product['item_detail']=$item_detail;
			}
			
			
			
			$response['product'][]=$product;
		}
		$response['success']='1';
		$response['message']="Fetch Detail Successful";
	}
	else
	{
		$response['product']=$product;
		$response['success']='0';
		$response['message']="No Data Available";
	}
	
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!!";
}	
echo json_encode($response);
?>