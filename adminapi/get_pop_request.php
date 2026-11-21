<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$select_request=mysqli_query($con,"select tbl_distributor_pop_request.*,`tbl_purchase_party`.`party_name`,`tbl_purchase_party`.`party_phone`, `tbl_purchase_party`.`place_of_supply` from tbl_distributor_pop_request, tbl_purchase_party where tbl_distributor_pop_request.distributor_id='$ver' AND tbl_distributor_pop_request.party_id = `tbl_purchase_party`.`purchase_party_id`");	
	$product=array();
	if(mysqli_num_rows($select_request)>0){
		while($fetch_purchase_request=mysqli_fetch_array($select_request))
		{
			$request_id=$fetch_purchase_request['request_id'];
			$product['request_id']=$fetch_purchase_request['request_id'];
			$product['party_id']=$fetch_purchase_request['party_id'];
			$product['party_name']=$fetch_purchase_request['party_name'];
			$product['party_phone']=$fetch_purchase_request['party_phone'];
			$product['place_of_supply']=$fetch_purchase_request['place_of_supply'];
			$product['po_orderid']=$fetch_purchase_request['po_orderid'];
			$product['invoice_id']=$fetch_purchase_request['invoice_id'];
			$product['transaction_date']=$fetch_purchase_request['transaction_date'];
			$product['transaction_time']=$fetch_purchase_request['transaction_time'];
			$product['total_amount']=$fetch_purchase_request['total_amount'];
			$product['payment_mode']=$fetch_purchase_request['payment_mode'];
			$product['bank_wallet_name']=$fetch_purchase_request['bank_wallet_name'];
			$product['payment_txn_id']=$fetch_purchase_request['payment_txn_id'];
			$product['cheque_txn_date']=$fetch_purchase_request['cheque_txn_date'];
			$product['payment_type']=$fetch_purchase_request['payment_type'];
			$product['order_status']=$fetch_purchase_request['order_status'];
			$product['reject_by']=$fetch_purchase_request['reject_by'];
			$product['approved_datetime']=$fetch_purchase_request['approved_datetime'];
			$product['accept_datetime']=$fetch_purchase_request['accept_datetime'];
			$product['shipped_datetime']=$fetch_purchase_request['shipped_datetime'];
			$product['shipment_received_datetime']=$fetch_purchase_request['shipment_received_datetime'];
			$product['pop_request_details']=array();

			$select_details=mysqli_query($con,"select tbl_distributor_pop_request_detail.*,tbl_product.* from tbl_distributor_pop_request_detail,tbl_product where tbl_distributor_pop_request_detail.request_id='$request_id' AND tbl_distributor_pop_request_detail.product_id=tbl_product.product_id");	

			while($fetch_purchase_request2=mysqli_fetch_array($select_details))
			{

				$product2['request_detail_id']=$fetch_purchase_request2['request_detail_id'];
				$product2['product_id']=$fetch_purchase_request2['product_id'];
				$product2['product_name']=$fetch_purchase_request2['product_name'];
				$product2['request_qty']=$fetch_purchase_request2['request_qty'];
				$product2['updated_qty']=$fetch_purchase_request2['updated_qty'];
				$product2['request_price']=$fetch_purchase_request2['request_price'];
				$product2['updated_price']=$fetch_purchase_request2['updated_price'];
				$product2['CGST']=$fetch_purchase_request2['CGST'];
				$product2['SGST']=$fetch_purchase_request2['SGST'];
				$product2['IGST']=$fetch_purchase_request2['IGST'];
				$product2['cess_applicable']=$fetch_purchase_request2['cess_applicable'];
				$product2['cess_pc_amt']=$fetch_purchase_request2['cess_pc_amt'];
				$product2['cess_percentage']=$fetch_purchase_request2['cess_percentage'];
				$product['pop_request_details'][]=$product2;
			}
			$response['pop_request'][]=$product;
		}
	}else{
		$response['pop_request']=$product;
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